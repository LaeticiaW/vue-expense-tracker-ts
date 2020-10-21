<template>
    <div>
        <v-dialog :value="value" width="500" @click:outside="close">

            <v-card>
                <v-toolbar dark color="primary">
                    <v-toolbar-title>Add Category</v-toolbar-title>
                </v-toolbar>

                <v-card-text class="dialog-content">
                    <v-form ref="form">
                        <div class="dialog-error error--text">{{dialogMessage}}</div>

                        <v-container class="form-container">
                            <v-row>
                                <v-col cols="12" md="12" class="category-col">
                                    <v-text-field ref="name" dense outlined required maxlength="30"
                                                  v-model="categoryName" label="Category"
                                                  :rules="nameRules" spellcheck="false" autocomplete="off"
                                                  @keydown.enter.prevent="addCategory"/>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-form>
                </v-card-text>

                <v-divider/>

                <v-card-actions>
                    <v-btn text color="#787878" @click="close">Cancel</v-btn>
                    <v-btn text color="primary" @click="addCategory">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import CategoryService from '@/services/category'
    import { VForm, NewCategory } from '@/types/index'

    export default Vue.extend({
        name: 'AddCategoryDialog',

        props: {
            // Component v-model property
            value: {
                type: Boolean,
                required: true
            }
        },

        data() {
            return {
                categoryName: '' as string,               
                isCategoryUnique: true as boolean,
                dialogMessage: '' as string,
                nameRules: [] as { (s: string | undefined): string | boolean }[]
            }
        },

        methods: {
            /*
             * Add the new category to the db, emit category-added event, and then close the dialog
             */
            addCategory() {
                this.dialogMessage = ''
                this.isCategoryUnique = true
                const category : NewCategory = {                    
                    name: this.categoryName,
                    subcategories: []
                }
                CategoryService.createCategory(category).then(() => {
                    this.$emit('category-added', this.categoryName)
                    // Close the dialog
                    this.close()
                }).catch((error) => {
                    if (error && error.data && error.data.errmsg && error.data.errmsg.indexOf('duplicate') !== -1) {
                        this.isCategoryUnique = false;
                        (this.$refs.form as VForm).validate()
                    } else {
                        console.error('Error creating category:', error)
                        this.dialogMessage = 'Error creating the Category'
                    }
                })
            },

            /*
             * Close the dialog
             */
            close() {
                this.$emit('input', false)
            }
        },

        /*
         * On mount focus the name field
         */
        mounted() {
            // Focus the name field
            setTimeout((<HTMLElement>this.$refs.name).focus, 0)

            // Set category name validation rules
            this.nameRules = [
                    (value) => !!value || 'Category Name is required',
                    () => this.isCategoryUnique || 'Category Name is not unique'
                ]
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';

    .form-container {
        padding: 0px;
    }
    .category-col {
        padding-top: 0px;
        padding-bottom: 0px;
    }
</style>
