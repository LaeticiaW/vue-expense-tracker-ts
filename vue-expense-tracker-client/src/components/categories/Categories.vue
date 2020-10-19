<template>
  <div class="page">
    <page-header title="Categories" />

    <div class="page-content">
      <!-- Grid layout for single row, two column layout, left column for tree view, right column for details view -->
      <v-row align="start" align-content="start">
        <v-col cols="12" sm="6" md="5">
          <v-card flat outlined class="category-tree-panel">
            <!-- Toolbar -->
            <v-toolbar dense flat color="secondary">
              <v-spacer></v-spacer>
              <v-menu offset-y>
                <template v-slot:activator="{ on }">
                  <v-btn small dark v-on="on" color="primary" title="Actions" class="icon-btn">
                    <v-icon small>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list dense>
                  <v-list-item @click="showCategoryDialog = true">
                    <v-list-item-title>Add Category</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    :disabled="!isCategorySelected"
                    @click="showSubcategoryDialog = true"
                  >
                    <v-list-item-title>Add Subcategory</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    :disabled="!isCategorySelected && !isSubcategorySelected"
                    @click="deleteItem"
                  >
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click="expandAllCategories">
                    <v-list-item-title>Expand All Categories</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="collapseAllCategories">
                    <v-list-item-title>Collapse All Categories</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-toolbar>
            <v-card-text>
              <!-- Category Tree -->
              <div class="category-tree-wrapper">
                <v-treeview
                  dense
                  activatable
                  return-object
                  ref="treeviewRef"
                  :items="categories"
                  item-key="treeId"
                  item-children="subcategories"
                  :active="activeTreeIds"
                  color="#454545"
                  :open="openCategories"
                  @update:active="itemActivated"
                  @update:open="itemOpened"
                >
                  <template v-slot:append="{item, leaf, active}">
                    <v-btn
                      icon
                      v-if="active && !leaf"
                      @click.stop="showSubcategoryDialog = true"
                      color="primary"
                      title="Add Subcategory"
                    >
                      <v-icon small>{{'mdi-plus'}}</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      v-if="active"
                      @click.stop="deleteItem"
                      color="primary"
                      title="Delete Category"
                    >
                      <v-icon small>{{'mdi-delete'}}</v-icon>
                    </v-btn>
                  </template>
                </v-treeview>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="7">
          <!-- Category Details -->
          <category-details
            v-if="isCategorySelected"
            :category="currentCategory"
            @category-updated="refreshCategories"
          />
          <!-- Subcategory Details -->
          <subcategory-details
            v-if="isSubcategorySelected"
            :category="parentCategory"
            :subcategory="currentSubcategory"
            @subcategory-updated="refreshCategories"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Add Category dialog -->
    <add-category-dialog
      v-if="showCategoryDialog"
      v-model="showCategoryDialog"
      @category-added="refreshCategories"
    />
    <!-- Add Subcategory dialog -->
    <add-subcategory-dialog
      v-if="showSubcategoryDialog"
      v-model="showSubcategoryDialog"
      :category="currentCategory"
      @subcategory-added="refreshCategories"
    />
    <!-- Snack Msg -->
    <snack-msg ref="snack" :options="snackOptions" />
  </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import PageHeader from '@/components/common/PageHeader.vue'
    import CategoryDetails from '@/components/categories/CategoryDetails.vue'
    import SubcategoryDetails from '@/components/categories/SubcategoryDetails.vue'
    import AddCategoryDialog from '@/components/categories/AddCategoryDialog.vue'
    import AddSubcategoryDialog from '@/components/categories/AddSubcategoryDialog.vue'    
    import SnackMsg from '@/components/common/SnackMsg.vue'
    import CategoryService from '@/services/category'
    import { Category, Subcategory, CategoryOrSubcategoryArray, CategoryMap, SnackOptions, VTreeView } from '@/types/index'

    export default Vue.extend({
        name: 'Categories',

        data() {
            return {
                categories: [] as Category[],
                categoryMap: {} as CategoryMap,
                currentCategory: null as Category | null,
                currentSubcategory: null as Subcategory | null,
                parentCategory: null as Category | null,
                activeTreeIds: [] as any[],
                openCategoryNames: [] as string[],
                openCategories: [] as Category[],
                showCategoryDialog: false as boolean,
                showSubcategoryDialog: false as boolean,
                maxCategoryId: null as string | null,
                snackOptions: {
                    show: false,
                    msg: '',
                    color: 'error'
                } as SnackOptions
            }
        },

        components: {
            PageHeader,
            CategoryDetails,
            SubcategoryDetails,
            AddCategoryDialog,
            AddSubcategoryDialog,
            SnackMsg
        },

        computed: {
            isCategorySelected() : boolean {
                return Boolean(this.currentCategory)
            },
            isSubcategorySelected() : boolean {
                return Boolean(this.currentSubcategory)
            }
        },

        methods: {
            /*
             * Retrieve the category data
             */
            getCategories() : void {
                CategoryService.getCategories().then((categories) => {
                    this.categories = categories
                    this.categoryMap = CategoryService.getCategoryMap(categories)
                    if (this.categories.length) {
                        // Default the active category to the first one in the list
                        this.activeTreeIds.push(this.categories[0])
                        this.currentCategory = this.categories[0]
                    }
                }).catch((error) => {
                    console.error('Error retreiving categories:', error)
                    this.snackOptions.msg = 'Error retrieving categories'
                    this.snackOptions.show = true                    
                })
            },

            /*
             * Callback for when a category or subcategory is selected in the tree
             */
            itemActivated(actives : CategoryOrSubcategoryArray) : void {
                if (actives && actives.length) {
                    if (this.isSubcategory(actives[0])) {
                        this.currentSubcategory = <Subcategory>actives[0]
                        if (this.currentSubcategory) {
                            this.parentCategory = this.getParentCategory(this.currentSubcategory)
                        }                        
                        this.currentCategory = null
                    } else {
                        this.currentCategory = <Category>actives[0]
                        this.currentSubcategory = null
                        this.parentCategory = null
                    }
                } else if (this.currentCategory) {
                    // Ensure that an item is always activated, do not allow user to deactivate the row that is currently active
                    if (this.currentCategory) {
                        this.activeTreeIds.push(this.currentCategory)
                    } else if (this.currentSubcategory) {
                        this.activeTreeIds.push(this.currentSubcategory)
                    }
                }
            },

            /*
             * Determine if the specified item is a category or a subcategory
             */
            isSubcategory(item : Category | Subcategory) : boolean {
                if (item.parentTreeId !== undefined) {
                    return true
                }
                return false
            },

            /*
             * Keep track of open items
             */
            itemOpened(opened : Category[]) : void {
                this.openCategories = opened
            },

            /*
             * When the Delete menu item is selected, determine wether to delete a category or subcategory
             */
            deleteItem() : void {
                if (this.isSubcategorySelected) {
                    this.deleteSubcategory()
                } else {
                    this.deleteCategory()
                }
            },

            /*
             * Delete the selected Category from the db
             */
            deleteCategory() : void {  
                const catName = this.currentCategory ? this.currentCategory.name : ''             
                this.$confirm(`Are you sure you want to delete category ${catName}?`, {
                    title: 'Confirm Delete Category'
                }).then((res) => {
                    if (res) { 
                        if (this.currentCategory) {                                      
                            CategoryService.deleteCategory(this.currentCategory._id).then(() => {
                                this.refreshCategories()
                            }).catch((error) => {
                                console.error('Error deleting category:', error)                           
                                if (error && error.data && error.data === 'Category in use') {
                                    this.snackOptions.msg = 'Category cannot be deleted because it is already assigned to expenses'
                                    this.snackOptions.show = true                                
                                } else {
                                    this.snackOptions.msg = 'Error deleting the category'
                                    this.snackOptions.show = true                                   
                                }
                            })
                        } else {
                            this.snackOptions.msg = 'Please select a category to delete'
                            this.snackOptions.show = true
                        }
                    }
                }) 
            },

            /*
             * Delete the subcategory from the category object and then save/update the category
             */
            deleteSubcategory() : void { 
                const subcatName = this.currentSubcategory ? this.currentSubcategory.name : ''               
                this.$confirm(`Are you sure you want to delete subcategory ${subcatName}?`, {
                    title: 'Confirm Delete Subcategory'
                }).then((res) => {
                    if (res) {                                                
                        let idx = this.categories.findIndex(cat => {
                            if (cat && cat.treeId && this.currentSubcategory && this.currentSubcategory.parentTreeId) {
                                return cat.treeId === this.currentSubcategory.parentTreeId
                            }
                            return false
                        })
                        if (idx !== -1) {
                            // Remove the subcategory from the category object
                            const category = this.categories[idx]                                                     
                            idx = category.subcategories.findIndex(subcat => {
                                if (subcat && subcat.treeId && this.currentSubcategory && this.currentSubcategory.treeId) {
                                    return subcat.treeId === this.currentSubcategory.treeId
                                } 
                                return false
                            })
                            if (idx !== -1) {
                                category.subcategories.splice(idx, 1)
                            }
                           

                            // Save the category to the db
                            CategoryService.updateCategory(category).then((cat) => {
                                this.refreshCategories(cat)
                            }).catch((error) => {
                                console.error('Error deleting subcategory:', error)
                                this.snackOptions.msg = 'Error deleting the subcategory'
                                this.snackOptions.show = true                               
                            })
                        }
                       
                    }
                })
            },

            /*
             * Retrieve the categories list again from the db and reset categories variables.
             * Note that currentCategory and currentSubcategory must contain references to the newly retrieved categories
             */
            refreshCategories(currentCat? : Category, currentSubcat? : Subcategory) {
                CategoryService.getCategories().then((categories : Category[]) => {
                    this.categories = categories
                    this.categoryMap = CategoryService.getCategoryMap(categories)
                    this.currentCategory = null
                    this.currentSubcategory = null

                    if (currentCat) {
                        // Find the current category in the list
                        const idx = this.categories.findIndex((cat) => cat._id === currentCat._id)
                        if (idx !== -1) {
                            this.currentCategory = this.categories[idx]
                        } else {
                            this.currentCategory = this.categories.length ? this.categories[0] : null
                        }
                    } else {
                        this.currentCategory = this.categories.length ? this.categories[0] : null
                    }

                    if (currentSubcat && this.currentCategory) {
                        // Find the current subcategory in the subcategory list
                        const subIdx = this.currentCategory.subcategories.findIndex((subcat) => subcat.name === currentSubcat.name)
                        if (subIdx !== -1) {
                            this.currentSubcategory = this.currentCategory.subcategories[subIdx]
                            this.parentCategory = this.currentCategory
                            this.currentCategory = null
                        }
                    }

                    // The activeTreeIds and openCategories arrays need to be recreated with the categories just retrieved,
                    // so that the object references match.
                    if (this.currentCategory) {
                        this.activeTreeIds = this.categories.length ? [this.currentCategory] : []
                    }

                    // this.openCategories = this.categories.filter((cat) => this.openCategories.filter((openItem : Category) => openItem._id === cat._id).length > 0)                   
                    const newOpenCategories = [] as Category[]                     
                    this.openCategories.forEach(openCat => {                                           
                        let cat : Category = this.categoryMap[openCat._id]                       
                        if (cat) {
                            newOpenCategories.push(cat)
                        }                       
                    })                   
                    this.openCategories = newOpenCategories
                }).catch((error) => {
                    console.error('Error retrieving categories:', error)
                    this.snackOptions.msg = 'Error retrieving the categories'
                    this.snackOptions.show = true                   
                })
            },

            /*
             * Return the parent category for the specified subcategory
             */
            getParentCategory(subcategory : Subcategory) : Category | null {
                const idx = this.categories.findIndex((cat) => cat.treeId === subcategory.parentTreeId)
                if (idx !== -1) {
                    return this.categories[idx]
                }
                return null
            },

            /*
             * Expand all categories in the tree
             */
            expandAllCategories() : void {
                (this.$refs.treeviewRef as VTreeView).updateAll(true)
            },

            /*
             * Collapse all categories in the tree
             */
            collapseAllCategories() : void {
                (this.$refs.treeviewRef as VTreeView).updateAll(false)
            }
        },

        /*
         * On create, retrieve the categories data
         */
        created() : void {
            this.getCategories()
        }
    })
</script>

<style lang="scss" scoped>
@import "../../styles/global.scss";

.category-tree-wrapper {
  height: calc(100vh - 240px);
  overflow-y: auto;
}
::v-deep .v-card {
  height: calc(100vh - 170px);
}
::v-deep .v-treeview-node__content {
  cursor: pointer;
}
</style>
