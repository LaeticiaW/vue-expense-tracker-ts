<template>
    <div class="page">
        <page-header title="Import Expenses"/>

        <div class="page-content table-content">
            <!-- Filter -->
            <table-filter>
                <template v-slot:inputs>
                    <!-- Start and end dates -->
                    <date-range-input :date-range="filter" @date-range-changed="filterChanged"></date-range-input>
                </template>

                <template v-slot:actions>
                    <v-btn small dark @click="showImportDialog" color="primary" title="Import Expenses"
                           class="icon-btn import-expenses-btn">
                        <v-icon small>{{'mdi-publish'}}</v-icon>
                    </v-btn>
                </template>
            </table-filter>

            <!-- Data Table -->
            <div class="table-container">
                <v-data-table :headers="headers" :items="imports" item-key="_id" :sort-by.sync="sortBy"
                              :sort-desc.sync="sortDesc" disable-pagination hide-default-footer must-sort>
                    <template v-slot:item.recordCount="{ item }">
                        <div class="text-right">{{item.recordCount}}</div>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-icon small @click="deleteImportedExpenses(item)"
                                title="Delete import and associated expenses">mdi-delete
                        </v-icon>
                    </template>
                    <template v-slot:no-data>
                        <div>No Data</div>
                    </template>
                </v-data-table>
            </div>
            <div class="table-footer">
                <v-toolbar flat dense>
                    <span>{{imports.length}} {{rowText}}</span>
                </v-toolbar>
            </div>
        </div>

        <!-- Import Expenses Dialog -->
        <import-dialog v-if="showDialog" v-model="showDialog" @file-imported="getImports"/>
        <!-- Snack Msg -->
        <snack-msg ref="snack" :options="snackOptions"/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import ImportDialog from '@/components/imports/ImportDialog.vue'
    import dayjs from 'dayjs'
    import ImportService from '@/services/import'
    import ExpenseService from '@/services/expense'
    import SnackMsg from '@/components/common/SnackMsg.vue'
    import TableFilter from '@/components/common/TableFilter.vue'
    import DateRangeInput from '@/components/common/DateRangeInput.vue'
    import PageHeader from '../common/PageHeader.vue'
    import { SnackOptions, Import, ImportFilter } from '@/types/index'

    export default Vue.extend({
        name: 'Imports',

        data() {
            return {
                showDialog: false,
                filter: {
                    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
                    endDate: dayjs().format('YYYY-MM-DD')
                } as ImportFilter,
                sortBy: 'importDate',
                sortDesc: true,
                imports: [] as Import[],
                headers: [
                    { value: 'importDate', text: 'Date', align: 'start' },
                    { value: 'fileName', text: 'File Name' },
                    { value: 'description', text: 'Description' },
                    {
                        value: 'recordCount', text: 'Records', width: '100px', align: 'right'
                    },
                    { value: 'actions', text: 'Actions', sortable: false }
                ],
                snackOptions: {
                    show: false,
                    msg: '',
                    color: 'error'
                } as SnackOptions
            }
        },

        components: {
            PageHeader,
            ImportDialog,
            SnackMsg,
            TableFilter,
            DateRangeInput
        },

        computed: {
            rowText() : string {
                return this.imports.length !== 1 ? 'rows' : 'row'
            }
        },

        methods: {
            /*
             * Retrieve the import summary list from the db
             */
            getImports() {
                ImportService.getImports(this.filter).then((imports : Import[]) => {
                    this.imports = imports
                }).catch((error) => {
                    console.error('Error retrieving imports:', error) 
                    this.snackOptions.msg = 'Error retrieving imports'   
                    this.snackOptions.show = true                                 
                })
            },

            /*
             * Show the import file dialog
             */
            showImportDialog() {
                this.showDialog = true
            },

            /*
             * When the filter changes, retrieve the import list again
             */
            filterChanged() {
                this.getImports()
            },

            /*
             * Delete the import summary and all associated expenses
             */
            deleteImportedExpenses(importItem : Import) {
                this.$confirm(`Are you sure you want to delete all ${importItem.recordCount} expenses associated with this import?`, {
                    title: 'Confirm Delete Imported Expenses'
                }).then((confirm) => {
                    if (confirm) {
                        ExpenseService.deleteExpensesByImportId(importItem._id).then(() => {
                            this.getImports()
                        }).catch((error) => {
                            console.error('Error deleting imported expenses:', error)
                            this.snackOptions.msg = 'Error deleting the imported expenses'   
                            this.snackOptions.show = true                                
                        })
                    }
                })
            }
        },

        /*
         * On mount, retrieve the import summary list
         */
        mounted() {
            this.getImports()
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';
</style>
