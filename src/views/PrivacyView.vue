<script setup></script>

<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-card-title class="text-h4">Privacy Policy</v-card-title>
          <v-card-subtitle>Last Updated: 30 September 2025</v-card-subtitle>

          <v-card-text>
            <p>
              This Privacy Policy explains what information is collected when you use the "AI Alibi"
              web application (the "Service"), why it is collected, and how it is used. This Service
              is a non-commercial, educational project.
            </p>

            <h3 class="text-h6 mt-4 mb-2">1. Data Controller</h3>
            <p>
              Mutlu Can Yilmaz<br />
              Leharstraße 6<br />
              86179 Augsburg <br />
              Germany<br />
              <strong>Email:</strong> mtlcnylmz@gmail.com
            </p>

            <h3 class="text-h6 mt-4 mb-2">2. What Data We Collect and Why</h3>
            <h4 class="text-subtitle-1 mt-3">a. For Game Creators (Moderators):</h4>
            <p>
              To create and manage games, you must sign in with a Google Account. We use Firebase
              Authentication for this process. We receive and store your unique user ID (UID) and
              email address provided by Google to identify you as the owner of a game session.
            </p>

            <h4 class="text-subtitle-1 mt-3">b. For Players (Teams):</h4>
            <p>
              When you join a game, you are assigned a temporary, anonymous user ID by Firebase
              Authentication. We do not require or collect any personal information like your name
              or email address to play. We collect the team name, color, and emoji you choose for
              display purposes within your game session.
            </p>

            <h4 class="text-subtitle-1 mt-3">c. In-Game Data:</h4>
            <p>
              The questions your team asks the AI witnesses and the answers generated are stored for
              the duration of the game. This is necessary for the AI to have conversational memory
              and for the game moderator to monitor the activity.
            </p>

            <h4 class="text-subtitle-1 mt-3">d. Automatically Collected Technical Data:</h4>
            <p>
              Like most online services, certain technical data is collected automatically to ensure
              the security and functionality of the application, such as your IP address and browser
              type. This data is processed by our third-party service providers.
            </p>

            <h3 class="text-h6 mt-4 mb-2">3. Third-Party Services</h3>
            <p>
              We rely on Google Firebase (for hosting, database, authentication, and AI services)
              and Cloudflare (for DNS). These services process technical data for their legitimate
              interests of providing a secure and reliable service. For more details, we encourage
              you to review their respective privacy policies.
            </p>

            <h3 class="text-h6 mt-4 mb-2">4. Your Rights under GDPR</h3>
            <p>
              As a user in the European Union, you have rights regarding your personal data,
              including the right to access, rectify, or erase your data. Please contact the Data
              Controller at the email address listed above to exercise these rights.
            </p>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn to="/" color="primary">Go to Home</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<style scoped></style>
