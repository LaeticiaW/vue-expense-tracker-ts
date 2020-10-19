<template>
    <div>
        <v-dialog :value="value" width="500" @click:outside="close()">

            <v-card>
                <v-toolbar dark color="primary">
                    <v-toolbar-title>Update Category</v-toolbar-title>
                </v-toolbar>

                <v-card-text class="dialog-content">
                    <v-form ref="form">
                        <div class="dialog-error error--text">{{dialogMessage}}</div>

                        <v-text-field dense outlined maxlength="30"
                                      v-model="tempCategory.name"
                                      label="Category"
                                      required
                                      :rules="nameRules"/>

                        <!--Subcategory List -->
                        <fieldset class="subcategories">
                            <legend>Subcategories</legend>

                            <v-list dense height="150" max-height="150" class="overflow-y-auto">
                                <v-list-item-group v-model="selectedSubcategory" ripple="false">
                                    <v-list-item v-for="(subcat, idx) in tempCategory.subcategories" :key="idx">
                                        <v-list-item-content>
                                            <v-list-item-title>{{subcat.name}}</v-list-item-title>
                                        </v-list-item-content>
                                        <v-list-item-action>
                                            <v-btn small icon @click.stop="deleteSubcategory(subcat, idx)"
                                                   color="primary"
                                                   title="Delete Subcategory">
                                                <v-icon small>{{'mdi-delete'}}</v-icon>
                                            </v-btn>
                                        </v-list-item-action>
                                    </v-list-item>
                                </v-list-item-group>
                            </v-list>

                        </fieldset>

                        <!-- Subcategory to add -->
                        <div class="new-subcategory-container">
                            <v-spacer/>
                            <v-text-field dense outlined v-model="newSubcategory" label="New Subcategory">
                                <template v-slot:append-outer>
                                    <v-btn dark small @click.stop="addSubcategory" color="primary" title="Add Subcategory"
                                           class="icon-btn">
                                        <v-icon small>{{'mdi-plus'}}</v-icon>
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </div>
                    </v-form>
                </v-card-text>

                <v-divider/>

                <v-card-actions>
                    <v-btn text color="#787878" @click="close">Cancel</v-btn>
                    <v-btn text color="primary" @click="save" :disabled="!tempCategory.name">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import CategoryService from '@/services/category'   
    import { v4 as uuidv4 } from 'uuid' 
    import _ from 'lodash-core'
    import { VForm, Category, Subcategory, Rule } from '@/types/index'

    export default Vue.extend({
        name: 'UpdateCategoryDialog',

        props: {
            // Component v-model property
            value: {
                type: Boolean,
                required: true
            },
            category: {
                type: Object,
                required: true
            }
        },

        data() {
            return {
                selectedSubcategory: undefined as Subcategory | undefined,
                nameRules: [] as Rule[],
                newSubcategory: '' as string,               
                tempCategory: this.category as Category,
                isCategoryUnique: true as boolean,
                dialogMessage: '' as string              
            }
        },

        methods: {
            /*
             * Save the Category to the db
             */
            save() : void {                
                this.dialogMessage = ''
                this.isCategoryUnique = true               
                                            
                CategoryService.updateCategory(this.tempCategory).then((cat : Category) => {                   
                    this.$emit('category-updated', cat)
                    // Close the dialog
                    this.close()
                }).catch((error) => {
                    if (error && error.data && error.data.errmsg && error.data.errmsg.indexOf('duplicate') !== -1) {
                        this.isCategoryUnique = false;
                        (this.$refs.form as VForm).validate()
                    } else {
                        console.error('Error saving category:', error)
                        this.dialogMessage = 'Error saving the Category'
                    }
                })                
            },

            /*
             * Close the dialog
             */
            close() {
                this.$emit('input', false)
            },

            /*
             * Add the new subcategory to the list of subcategories
             */
            addSubcategory() : void {
                this.dialogMessage = ''
                if (!this.newSubcategory || !this.tempCategory) {
                    return
                }

                const subcat : Subcategory = { 
                    id: uuidv4(),                   
                    name: this.newSubcategory,
                    parentTreeId: this.tempCategory.treeId,
                    matchText: []
                }

                this.tempCategory.subcategories.push(subcat)
                this.newSubcategory = ''

                this.sortArray(this.tempCategory.subcategories, 'name')
            },

            /*
             * Delete the subcategory from the list
             */
            deleteSubcategory(subcat : Subcategory, idx: number) : void {
                this.dialogMessage = ''
                if (this.tempCategory) {
                    this.tempCategory.subcategories.splice(idx, 1)
                }                
            }
        },

        /*
         * On create, make a deep copy of the category for form use
         */
        created() : void {
            this.tempCategory = _.cloneDeep(this.category)

            this.nameRules = [
                (value) => !!value || 'Category Name is required',
                () => {
                    this.dialogMessage = ''
                    return this.isCategoryUnique || 'Category Name is not unique'
                }
            ]
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';

    .subcategories {
        padding: 8px;
        border-radius: 5px;
        border: solid 1px #9a9a9a;
    }
    .new-subcategory-container {
        padding-top: 16px;
    }
    ::v-deep .v-list-item__action {
        margin: 6px 0px !important;
    }
</style>
