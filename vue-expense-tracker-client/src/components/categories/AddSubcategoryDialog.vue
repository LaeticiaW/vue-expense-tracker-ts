<template>
    <div v-if="value">
        <v-dialog :value="value" width="400" @click:outside="close">

            <v-card>
                <v-toolbar dark color="primary">
                    <v-toolbar-title>Add Subcategory</v-toolbar-title>
                </v-toolbar>

                <v-card-text class="dialog-content">
                    <v-form ref="form">
                        <div v-if="dialogMessage" class="dialog-error error--text">{{dialogMessage}}</div>

                        <v-container class="form-container">
                            <v-row>
                                <v-col cols="12" md="12" class="subcategory-col">
                                    <v-text-field ref="name" dense outlined required maxlength="30"
                                                  v-model="subcategoryName"
                                                  :rules="nameRules" label="Subcategory"
                                                  spellcheck="false" autocomplete="off"
                                                  @keydown.enter.prevent="addSubcategory"/>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-form>
                </v-card-text>

                <v-divider/>

                <v-card-actions>
                    <v-btn text color="#787878" @click="close">Cancel</v-btn>
                    <v-btn text color="primary" @click="addSubcategory">Save</v-btn>
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
    import { VForm, Rule } from '@/types/index'

    export default Vue.extend({
        name: 'AddSubcategoryDialog',

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
                subcategoryName: '' as string,
                dialogMessage: '' as string,
                isSubcategoryUnique: true as boolean,
                nameRules: [] as Rule[]                   
            }
        },

        methods: {
            /*
             * Add the new subcategory to the parent category and save to the db
             */
            addSubcategory(): void {
                const newCategory = _.cloneDeep(this.category)
                newCategory.subcategories.push({
                    id: uuidv4(),
                    name: this.subcategoryName,
                    matchText: []
                })

                this.sortArray(newCategory.subcategories, 'name')

                CategoryService.updateCategory(newCategory).then(() => {
                    this.$emit('subcategory-added', this.category.name, this.subcategoryName)
                    this.close()
                }).catch((error) => {
                    if (error && error.data && error.data.errmsg && error.data.errmsg.indexOf('duplicate') !== -1) {
                        this.isSubcategoryUnique = false;
                        (<VForm>this.$refs.form).validate()
                    } else {
                        console.error('Error creating subcategory:', error)
                        this.dialogMessage = 'Error creating the Subcategory'
                    }
                })
            },

            /*
             * Close the dialog
             */
            close() : void {
                this.$emit('input', false)
            }
        },

        /*
         * On create
         */
        created() : void {
            this.nameRules = [
                (value) => !!value || 'Subcategory Name is required',
                () => this.isSubcategoryUnique || 'Subcategory Name is not unique'
            ] 
        },

        /*
         * On mount, focus the name field
         */
        mounted() : void {
            // Focus the name field
            setTimeout((<HTMLElement>this.$refs.name).focus, 0)            
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';

    .form-container {
        padding: 0px;
    }
    .subcategory-col {
        padding-top: 0px;
        padding-bottom: 0px;
    }
</style>
