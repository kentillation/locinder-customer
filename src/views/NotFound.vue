<!-- eslint-disable vue/valid-v-slot -->
<template>
    <v-container>
        <v-card class="d-flex flex-column align-center text-center mx-auto mt-10" height="270" width="100%" rounded>
            <div class="w-100 mt-10">
                <v-icon :size="iconSize" icon="mdi-web-off" class="text-red-darken-2 mb-3"></v-icon>
                <h2 class="text-red-darken-2 mb-3">Page not found!</h2>
                <p class="text-grey">Looks like the page you are trying to navigate is not found.</p>
            </div>
        </v-card>
    </v-container>
</template>

<script>
export default {
    name: "NotFound",
    data() {
        return {
            iconSize: "70px",
        };
    },
};
</script>