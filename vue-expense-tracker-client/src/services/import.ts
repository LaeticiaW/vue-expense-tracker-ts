import axios, { AxiosResponse } from 'axios'
import { ImportFilter } from '@/types/index'

export default {
    importUrl: 'http://localhost:3000/import',

    /*
     * Retrieve the list of import summaries
     * @param {object} filter - filter values to use when retrieving import summaries
     */
    getImports(filter : ImportFilter) {
        return axios.get(this.importUrl, {
            params: {
                startDate: filter.startDate,
                endDate: filter.endDate
            }
        }).then((response : AxiosResponse) => {
            const imports = response.data
            return imports
        }).catch((error) => {
            console.error('ImportService.getImports error:', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Delete the specified import summary and all associated imported expenses
     * @param {string} importId - id of import to delete
     */
    deleteImport(importId : string) {
        return axios({
            url: this.importUrl + importId,
            method: 'DELETE'
        }).then((response) => response.data).catch((error) => {
            console.error('ImportService.deleteImport error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    }
}
