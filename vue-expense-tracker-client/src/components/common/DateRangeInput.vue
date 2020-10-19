<template>
    <!-- Common Date Range input -->
    <div class="date-range-container">
        <!-- Start Date -->
        <span class="date-wrapper">
            <v-menu offset-y bottom v-model="startDateMenu" :close-on-content-click="true" transition="scale-transition">
                <template v-slot:activator="{ on }">
                    <v-text-field ref="startDate" outlined readonly dense hide-details required
                                  v-model="dateRange.startDate" name="startDate" v-on="on" class="start-date"
                                  background-color="#ffffff" label="Start Date" :maxlength="10"
                                  spellcheck="false" autocomplete="off" autofocus/>
                </template>
                <v-date-picker v-model="dateRange.startDate" no-title scrollable header-color="primary"
                               :max="maxDate" @input="dateRangeChanged">
                    <v-spacer/>
                    <v-btn text color="primary" @click="startDateMenu = false">Cancel</v-btn>
                </v-date-picker>
            </v-menu>
        </span>

        <!-- End Date -->
        <span class="date-wrapper">
            <v-menu offset-y bottom v-model="endDateMenu" :close-on-content-click="true"
                    transition="scale-transition">
                <template v-slot:activator="{ on }">
                    <v-text-field ref="endDate" outlined readonly dense hide-details required
                                  v-model="dateRange.endDate" name="endDate" v-on="on" class="end-date"
                                  background-color="#ffffff" label="End Date" :maxlength="10"
                                  spellcheck="false" autocomplete="off" autofocus/>
                </template>
                <v-date-picker v-model="dateRange.endDate" no-title scrollable header-color="primary"
                               :max="maxDate" @input="dateRangeChanged">
                    <v-spacer/>
                    <v-btn text color="primary" @click="endDateMenu = false">Cancel</v-btn>
                </v-date-picker>
            </v-menu>
        </span>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'   
    import dayjs from 'dayjs'

    export default Vue.extend({
        name: 'DateRangeInput',
        props: {
            // dateRange object contains startDate, endDate properties
            dateRange: {
                type: Object,
                required: true
            }
        },
        data() {
            return {
                startDateMenu: false as boolean,
                endDateMenu: false as boolean,
                minDate: '' as string,
                maxDate: dayjs().format('YYYY-MM-DD') as string
            }
        },
        computed: {
            startDateMax() : void {
                return this.dateRange.endDate
            },
            endDateMin() : void {
                return this.dateRange.startDate
            }
        },
        methods: {
            /*
             * When the user changes the start or end date values, calculate the number (ms) date values from the string values
             * and emit the date-range-changed event.
             */
            dateRangeChanged() : void {
                // this.setMsDates()
                this.$emit('date-range-changed', this.dateRange)
            }
        },

        /*
         * On create, initialize the date range values
         */
        created() : void {
            if (!this.dateRange.startDate) {
                dayjs().startOf('year').format('YYYY-MM-DD')
            }
            if (!this.dateRange.endDate) {
                dayjs().format('YYYY-MM-DD')
            }
        }
    })
</script>

<style lang="scss" scoped>
    .date-wrapper {
        display: inline-block;
        width: 120px !important;
        margin-right: 8px !important;
    }
</style>
