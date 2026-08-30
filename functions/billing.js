import process from 'node:process'
import { onMessagePublished } from 'firebase-functions/v2/pubsub'
import { CloudBillingClient } from '@google-cloud/billing'
import { logger } from 'firebase-functions'
import { FUNCTIONS_REGION } from './config.js'

const billingClient = new CloudBillingClient()

/**
 * Disables billing for a GCP project by unlinking its billing account.
 * @param {string} projectId - The Google Cloud project ID
 * @returns {Promise<{success: boolean, alreadyDisabled?: boolean, billingEnabled?: boolean}>} Result of the operation
 */
export async function disableBillingForProject(projectId) {
  const projectName = `projects/${projectId}`

  // 1. Check current billing status
  const [billingInfo] = await billingClient.getProjectBillingInfo({ name: projectName })

  if (!billingInfo.billingEnabled) {
    logger.info(`[Billing KillSwitch] Billing is already disabled for project: ${projectId}`)
    return { success: true, alreadyDisabled: true }
  }

  logger.warn(`[Billing KillSwitch] Disabling billing for project: ${projectId}`)

  // 2. Clear billingAccountName to unlink billing account and shut down billable services
  const [updatedBillingInfo] = await billingClient.updateProjectBillingInfo({
    name: projectName,
    projectBillingInfo: {
      billingAccountName: '',
    },
  })

  logger.info(`[Billing KillSwitch] Billing successfully disabled for ${projectId}`, {
    billingEnabled: updatedBillingInfo.billingEnabled,
  })

  return { success: true, billingEnabled: updatedBillingInfo.billingEnabled }
}

/**
 * Cloud Function Pub/Sub Trigger: Automatically shuts off billing when budget limit is reached or exceeded.
 * Topic: billing-budget-alerts
 */
export const stopBillingOnBudgetExceeded = onMessagePublished(
  {
    topic: 'billing-budget-alerts',
    region: FUNCTIONS_REGION,
  },
  async (event) => {
    try {
      const messageData = event.data?.message?.json
      logger.info('[Billing KillSwitch] Received budget notification:', messageData)

      if (!messageData) {
        logger.error('[Billing KillSwitch] Event message does not contain valid JSON data.')
        return
      }

      const { costAmount, budgetAmount, budgetDisplayName, alertThresholdExceeded } = messageData
      logger.info(
        `[Billing KillSwitch] Budget "${budgetDisplayName || 'Unnamed'}": ` +
          `Current cost = ${costAmount}, Budget limit = ${budgetAmount}, Threshold = ${alertThresholdExceeded}`,
      )

      // Verify whether budget limit is reached or exceeded
      const isBudgetExceeded =
        typeof costAmount === 'number' && typeof budgetAmount === 'number'
          ? costAmount >= budgetAmount
          : typeof alertThresholdExceeded === 'number'
            ? alertThresholdExceeded >= 1.0
            : false

      if (!isBudgetExceeded) {
        logger.info(
          `[Billing KillSwitch] Budget threshold not exceeded yet (Cost: ${costAmount} / Budget: ${budgetAmount}). No action taken.`,
        )
        return
      }

      const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'aialibi'
      logger.warn(
        `[Billing KillSwitch] Budget limit exceeded! Triggering kill switch for project "${projectId}"...`,
      )

      await disableBillingForProject(projectId)
    } catch (error) {
      logger.error('[Billing KillSwitch] Error executing billing kill switch:', error)
      throw error
    }
  },
)
