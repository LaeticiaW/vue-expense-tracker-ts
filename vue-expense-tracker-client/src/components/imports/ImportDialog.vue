<template>
    <div>
        <v-dialog persistent :value="value" width="750" content-class="import-dialog" @click:outside="$emit('input', false)">

            <v-card>
                <v-toolbar dark color="primary">
                    <v-toolbar-title>Import Expenses</v-toolbar-title>
                </v-toolbar>

                <v-divider/>

                <v-card-text class="dialog-content">
                    <div class="dialog-error error--text">{{dialogMessage}}</div>

                    <v-form ref="form" v-model="isFormValid">
                        <v-container class="form-container">
                            <v-row>
                                <v-col cols="12" sm="6" class="form-col">
                                    <v-card flat outlined class="fill-height">
                                        <v-toolbar dense flat color="secondary">
                                            <v-toolbar-title>File Info</v-toolbar-title>
                                        </v-toolbar>
                                        <v-divider></v-divider>
                                        <v-card-text class="card-text">
                                            <v-file-input v-model="fileInfo.csvFile" dense outlined required
                                                          label="File Name" :rules="[ruleRequired]"/>
                                            <v-text-field v-model="fileInfo.description" dense outlined required
                                                          label="Description" :rules="[ruleRequired]"/>
                                            <v-select v-model="fileInfo.dateFormat" dense outlined
                                                      label="Date Format" :items="dateFormats" :rules="[ruleRequired]"/>
                                            <v-checkbox v-model="fileInfo.negativeExpenses" class="has-header-row-checkbox"
                                                        label="Expenses are Negative"/>
                                        </v-card-text>
                                    </v-card>
                                </v-col>

                                <v-col cols="12" sm="6" class="form-col">
                                    <v-card flat outlined class="fill-height">
                                        <v-toolbar dense flat color="secondary">
                                            <v-toolbar-title>File Structure</v-toolbar-title>
                                        </v-toolbar>
                                        <v-divider></v-divider>
                                        <v-card-text class="card-text">
                                            <v-select v-model="fileStructure.dateFormatField" dense outlined required
                                                      label="Date Field Position" :items="fieldPositions" :rules="[ruleRequired]"/>
                                            <v-select v-model="fileStructure.amountField" dense outlined required
                                                      label="Amount Field Position" :items="fieldPositions" :rules="[ruleRequired]"/>
                                            <v-select v-model="fileStructure.descriptionField" dense outlined required
                                                      label="Description Field Position" :items="fieldPositions" :rules="[ruleRequired]"/>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-form>

                </v-card-text>

                <v-divider/>

                <v-card-actions class="card-actions">
                    <v-btn text color="#787878" @click="cancel">Cancel</v-btn>
                    <v-btn text color="primary" :disabled="!initialized" @click="importExpenses">Import</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import CategoryService from '@/services/category'
    import ExpenseService from '@/services/expense'
    import { ImportExpense, Category, Subcategory, VForm, Expense } from '@/types/index'
    import dayjs from 'dayjs'

    export default Vue.extend({
        name: 'ImportDialog',

        props: {
            value: {
                type: Boolean,
                required: true
            }
        },

        data() {
            return {
                initialized: false as boolean,
                isFormValid: undefined as boolean | undefined,
                categories: [],
                fileInfo: {
                    csvFile: null as File | null,
                    dateFormat: '' as string,
                    negativeExpenses: false as boolean,
                    amount: null as number | null,
                    description: '' as string
                },
                fileStructure: {
                    hasHeaderRow: true as boolean,
                    dateFormatField: null as number | null,
                    amountField: null as number | null,
                    descriptionField: null as number | null
                },
                dialogMessage: '' as string,
                importRecords: [] as string[],
                expenses: [] as ImportExpense[],
                parsedExpense: {
                    trxDate: null as string | null,
                    amount: null as string | number | null,
                    description: null as string | null
                } as ImportExpense | undefined,
                dateFormats: [
                    { value: 'YYYY-MM-DD', text: 'YYYY-MM-DD' },
                    { value: 'MM-DD-YYYY', text: 'MM-DD-YYYY' }
                ],
                fieldPositions: [
                    { value: 1, text: '1' },
                    { value: 2, text: '2' },
                    { value: 3, text: '3' },
                    { value: 4, text: '4' },
                    { value: 5, text: '5' },
                    { value: 6, text: '6' },
                    { value: 7, text: '7' },
                    { value: 8, text: '8' },
                    { value: 9, text: '9' },
                    { value: 10, text: '10' }
                ]
            }
        },

        methods: {
            /*
             * Import the expenses from the CSV file
             */
            async importExpenses() : Promise<void> {
                const self = this
                this.dialogMessage = ''
                this.expenses = []

                // Validate the form fields before importing
                if (!((<VForm>this.$refs.form).validate())) {
                    return
                }

                // Read the records from the import file
                await this.readImportFile().then((records) => {
                    this.importRecords = records
                }).catch((error) => {
                    console.error('Error importing file:', error)
                    this.dialogMessage = 'Unable to import the file'
                })

                if (!this.importRecords.length) {
                    this.dialogMessage = 'No records to import'
                    return
                }

                // Parse out the first record of the file for the confirmation dialog
                this.parsedExpense = this.getExpenseObject(this.importRecords[this.fileStructure.hasHeaderRow ? 1 : 0], false)
                if (this.parsedExpense) {
                    // Create the confirmation message and ask the user to confirm the import record parsing
                    const msg = `${'<div>Parsed fields from the first record are displayed below.  Are you sure you want to continue the import?</div>'
                        + '<br/>'
                        + '<div><label style=\'font-weight: bold;\'>Date: </label><span>'}${this.parsedExpense.trxDate}</span></div>`
                        + `<div><label style='font-weight: bold;'>Amount: </label><span>${this.parsedExpense.amount}</span></div>`
                        + `<div><label style='font-weight: bold;'>Desc: </label><span>${this.parsedExpense.description}</span></div>`

                    this.$confirm(msg, {
                        title: 'Confirm Import',
                        width: 500
                    }).then((confirm) => {
                        if (confirm) {
                            // Create expense objects for each import file record
                            this.importRecords.forEach((rec, idx) => {
                                if (!this.fileStructure.hasHeaderRow || idx > 0) {
                                    const exp = this.getExpenseObject(rec)
                                    if (exp) {
                                        this.expenses.push(exp)
                                    }
                                }
                            })

                            // Create an import details summary object
                            const importDetails = {
                                importDate: dayjs().format('YYYY-MM-DD'),
                                fileName: this.fileInfo.csvFile ? this.fileInfo.csvFile.name : '',
                                description: this.fileInfo.description,
                                recordCount: this.expenses.length
                            }

                            // Store the expenses and the import details in the db
                            ExpenseService.importExpenses(this.expenses, importDetails).then(() => {
                                this.$emit('file-imported')
                                // Close the dialog
                                this.$emit('input', false)
                            }).catch((error) => {
                                console.error('Error importing expenses:', error)
                                this.dialogMessage = 'Error importing expenses'
                            })
                        }
                    })
                } else {
                    this.dialogMessage = 'Unable to parse first import file record'
                }
            },

            /*
             * Read the records from the CSV file
             */
            readImportFile() : Promise<string[]> {
                return new Promise((resolve, reject) => {
                    const fileReader = new FileReader()
                    fileReader.onload = () => {
                        const records : string[] = (<string>fileReader.result).split('\n')
                        resolve(records)
                    }
                    fileReader.onerror = () => {
                        console.error(`Unable to read import file: ${fileReader.error}`)
                        reject(`Unable to read import file: ${fileReader.error}`)
                    }
                    fileReader.readAsText(<Blob>this.fileInfo.csvFile)
                })
            },

            /*
             * Convert the CSV record into an Expense object
             */
            getExpenseObject(record : string, validate = true) : ImportExpense | undefined {
                const fields: string[] = record.split(',')
                if (fields.length) {
                    const expense : ImportExpense | undefined = this.normalizeExpense(fields)

                    if (validate && !this.validate(expense)) {
                        return undefined
                    }

                    // Set the expense categoryId and subcategoryId if the expense description matches any subcategory matchText
                    if (expense && expense.description) {
                        this.categories.forEach((cat : Category) => {
                            if (cat.subcategories) {
                                cat.subcategories.forEach((subcat : Subcategory) => {
                                    if (subcat.matchText) {
                                        subcat.matchText.forEach((text : string) => {
                                            const regex = new RegExp(text, 'i')
                                            if (expense.description && expense.description.match(regex)) {
                                                expense.categoryId = cat._id
                                                expense.subcategoryId = subcat.id
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }

                    return expense
                }
                return undefined
            },

            /*
             * Copy the CSV record fields into an expense object and then normalize some of the data
             */
            normalizeExpense(fields : string[]) : ImportExpense | undefined {
                
                if (!fields || !this.fileStructure.dateFormatField || 
                    !this.fileStructure.descriptionField || !this.fileStructure.amountField) {
                    return undefined
                }
          
                const expense : ImportExpense = {
                    trxDate: fields[this.fileStructure.dateFormatField - 1],
                    description: fields[this.fileStructure.descriptionField - 1],
                    amount: fields[this.fileStructure.amountField - 1],
                    categoryId: null,
                    subcategoryId: null
                }

                // Remove quotation marks from fields
                if (typeof expense.trxDate === 'string') {
                    expense.trxDate = expense.trxDate.replace(/"/g, '')
                }
                if (typeof expense.description === 'string') {
                    expense.description = expense.description.replace(/"/g, '')
                }
                if (typeof expense.amount === 'string') {
                    expense.amount = expense.amount.replace(/"/g, '')
                }

                // If amount has parens, convert to minus sign
                if (typeof expense.amount === 'string' && expense.amount.substr(0, 1) === '(') {
                    expense.amount.replace(/^\(/, '-')
                    expense.amount.replace(/\)/g, '')
                }

                // Remove leading '$' from amount
                if (typeof expense.amount === 'string' && expense.amount.substr(0, 1) === '$') {
                    expense.amount = expense.amount.substr(1)
                }

                // Convert amount to number
                expense.amount = Number(expense.amount)

                // Ensure expense amounts are positive
                if (this.fileInfo.negativeExpenses) {
                    expense.amount *= -1
                }

                return expense
            },

            /*
             * Validate the expense object
             */
            validate(expense : ImportExpense | undefined ) : boolean {
                if (!expense) {
                    return false
                }
                if (!this.isValidAmount(expense.amount)) {
                    return false
                }
                if (!this.isValidDate(expense.trxDate, this.fileInfo.dateFormat)) {
                    return false
                }
                return true
            },

            /*
             * Determine if an amount value is valid
             */
            isValidAmount(value : string | number) : boolean {
                const val = typeof value === 'string' ? parseFloat(value) : value
                if (val === undefined || val === null || val <= 0 || Number.isNaN(val)) {
                    console.error('Invalid amount:', value)
                    return false
                }
                return true
            },

            /*
             * Determine if a date value is valid
             */
            isValidDate(value : string, dateFormat : string) : boolean {
                if (!dayjs(value, dateFormat)) {
                    console.error('Invalid date:', value, 'format:', dateFormat)
                    return false
                }
                return true
            },

            /*
             * Close the dialog
             */
            cancel() : void {
                this.$emit('input', false)
            }
        },

        /*
         * On create, retrieve the category list
         */
        created() : void {
            CategoryService.getCategories().then((categories) => {
                this.categories = categories
                this.initialized = true
            }).catch((error) => {
                this.dialogMessage = 'Error retrieving categories, import can continue but categories/subcategory will not be added to imported expenses'
                console.error('Error retrieving categories from import dialog:', error)
            })
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';

    .dialog-error {
        color: #bf0d3e;
        padding-bottom: 16px;
    }
    .dialog-content {
        padding-top: 24px !important;

        .form-container {
            padding-top: 0px !important;
            padding-bottom: 0px !important;

            .form-col {
                padding-top: 0px !important;
                padding-bottom: 0px !important;
            }
            .card-text {
                padding-bottom: 0px !important;

                label {
                    font-weight: bold;
                }
            }
            .has-header-row-checkbox {
                margin-top: 4px !important;
                margin-bottom: 8px !important;
            }
        }
    }
</style>
