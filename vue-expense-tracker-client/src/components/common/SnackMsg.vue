<template>
    <!-- Common snackbar -->
    <v-snackbar v-model="options.show" :color="options.color">
        {{options.msg}}
        <v-btn text @click.native="options.show = false">
            <v-icon>mdi-close</v-icon>
        </v-btn>
    </v-snackbar>
</template>

<script lang="ts">
    import Vue from 'vue'

    export default Vue.extend({
        name: 'SnackMsg',
        props: {
            /*
             * Options object contains show, color, msg properties
             */
            options: {
                type: Object,
                required: true
            }
        },
        methods: {
            /*
             * This method can optionally be called from a parent if the 'ref' attribute is on the component tag
             */
            show(msg : string, color : string = 'error') : void {
                this.options.msg = msg
                this.options.color = color
                this.options.show = true
            }
        }
    })
</script>

<style scoped>
</style>
