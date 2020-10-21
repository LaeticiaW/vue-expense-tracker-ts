<template>
    <div class="page">
        <page-header title="Manage Expenses"/>

        <div class="page-content table-content">
            <!-- Filter -->
            <table-filter>
                <template v-slot:inputs>
                    <!-- Start and end dates -->
                    <date-range-input :date-range="filter" @date-range-changed="filterChanged"/>
                    <!-- Category -->
                    <category-select v-model="filter.categoryIds" :items="selectCategories" label="Category"
                                     @change="filterChanged"/>
                </template>

                <template v-slot:actions>
                    <v-btn small dark @click="showAddExpenseDialog" color="primary" title="Create New Expense"
                           class="icon-btn create-expense-btn">
                        <v-icon small>{{'mdi-plus'}}</v-icon>
                    </v-btn>
                </template>
            </table-filter>

            <!-- Data Table -->
            <div class="table-container">
                <v-data-table :headers="headers" :items="expenses" item-key="_id"
                              :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"
                              @click:row="rowClicked" disable-pagination hide-default-footer must-sort>
                    <template v-slot:item.amount="{ item }">
                        <span>{{item.amount | formatAmount}}</span>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-icon small color="primary" class="mr-3" @click="updateExpense(item)">mdi-pencil</v-icon>
                        <v-icon small @click="deleteExpense(item)">mdi-delete</v-icon>
                    </template>
                    <template v-slot:no-data>
                        <div>No Data</div>
                    </template>
                </v-data-table>
            </div>
            <div class="table-footer">
                <v-toolbar flat dense>
                    <span>{{expenses.length}} {{rowText}}</span>
                </v-toolbar>
            </div>
        </div>

        <!-- Update Expense Dialog -->
        <expense-dialog v-if="showExpenseDialog" v-model="showExpenseDialog" :expense="selectedExpense"
                        @expense-updated="getExpenses"/>

        <!-- Snack Msg -->
        <snack-msg ref="snack" :options="snackOptions"/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import dayjs from 'dayjs'
    import ExpenseDialog from '@/components/expenses/ExpenseDialog.vue'
    import ExpenseService from '@/services/expense'
    import CategoryService from '@/services/category'
    import SnackMsg from '@/components/common/SnackMsg.vue'
    import TableFilter from '@/components/common/TableFilter.vue'
    import DateRangeInput from '@/components/common/DateRangeInput.vue'
    import PageHeader from '../common/PageHeader.vue'
    import CategorySelect from '../common/CategorySelect.vue'
    import { SnackOptions, Expense, ExpenseFilter, Category, CategorySelectItem } from '@/types/index'

    export default Vue.extend({
        name: 'Expenses',

        data() {
            return {
                showExpenseDialog: false as boolean,
                selectedExpense: {} as Partial<Expense>,
                newExpense: {} as Expense,
                sortBy: 'trxDate' as string,
                sortDesc: true as boolean,
                expenses: [] as Expense[],
                categories: [] as Category[],
                selectCategories: [] as CategorySelectItem[],
                filter: {
                    startDate: dayjs().startOf('year').format('YYYY-MM-DD') as string,
                    endDate: dayjs().format('YYYY-MM-DD') as string,
                    categoryIds: [] as string[]
                } as ExpenseFilter,
                headers: [
                    { value: 'trxDate', text: 'Date', align: 'start' },
                    { value: 'description', text: 'Description' },
                    { value: 'categoryName', text: 'Category' },
                    { value: 'subcategoryName', text: 'Subcategory' },
                    { value: 'amount', text: 'Amount', align: 'end' },
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
            ExpenseDialog,
            SnackMsg,
            TableFilter,
            DateRangeInput,
            CategorySelect
        },

        computed: {
            rowText() : string {
                return this.expenses.length !== 1 ? 'rows' : 'row'
            }
        },

        methods: {
            /*
             * Retrieve the expense data
             */
            getExpenses() : void {
                // Retrieve the expense list
                ExpenseService.getExpenses(this.filter).then((expenses) => {
                    this.expenses = expenses
                }).catch((error) => {
                    console.error('Error retrieving expenses:', error)
                    this.snackOptions.msg = 'Error retrieving the expense data'
                    this.snackOptions.show = true                   
                })
            },

            /*
             * Get the categories for the select drop down
             */
            getCategorySelect() : void {
                CategoryService.getCategorySelect().then((selectCategories) => {
                    this.selectCategories = selectCategories
                }).catch((error) => {
                    console.error('Error retrieving category select:', error)
                    this.snackOptions.msg = 'Error retrieving category select data'
                    this.snackOptions.show = true                    
                    return Promise.reject(error)
                })
            },

            /*
             * When a filter value changes, retrieve the expenses again
             */
            filterChanged() : void {
                this.getCategorySelect()
                this.getExpenses()
            },

            /*
             * When a table row is clicked, save that expense as the selectedExpense
             */
            rowClicked(expense : Expense) : void {
                this.selectedExpense = expense
            },

            /*
             * Display the add expense dialog
             */
            showAddExpenseDialog() : void {
                this.showExpenseDialog = true
                this.selectedExpense = {                                    
                    trxDate: '',
                    categoryId: '',
                    subcategoryId: '',
                    amount: 0,
                    description: ''                  
                }
            },

            /*
             * Display the Create/Update Expense dialog
             */
            updateExpense(expense : Expense) : void {
                this.selectedExpense = expense
                this.showExpenseDialog = true
            },

            /*
             * Delete the expense
             */
            deleteExpense(expense : Expense) : void {
                this.$confirm(`Are you sure you want to delete expense ${expense.amount}?`, {
                    title: 'Confirm Delete Expense'
                }).then((confirm) => {
                    if (confirm) {
                        ExpenseService.deleteExpense(expense._id).then(() => {
                            this.getExpenses()
                        }).catch((error) => {
                            console.error('Error deleting expenses:', error)
                            this.snackOptions.msg = 'Error deleting the expense'
                            this.snackOptions.show = true                            
                        })
                    }
                })
            }
        },

        /*
         * On mount, retrieve the expenses
         */
        mounted() : void {
            this.getCategorySelect()
            this.getExpenses()
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';
</style>
