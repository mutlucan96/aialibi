<template>
  <v-row justify="center" class="mt-12">
    <v-col cols="12" sm="8" md="6">
      <v-text-field
        label="Enter game code..."
        variant="outlined"
      ></v-text-field>
    </v-col>
    <v-col cols="auto">
      <v-btn>Join</v-btn>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: "JoinGame",
};
</script>
