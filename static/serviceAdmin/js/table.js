// CSRF Token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// Toggle table
document.addEventListener("DOMContentLoaded", function(){
    productSpecTable()
    document.querySelectorAll('[name="prods"]').forEach((i, item)=>{
        i.addEventListener('change', function(){
            // if(this.checked){
            //     document.querySelector('#gridContainer').style.display = "none";
            //     loadSpareTable();
            // }else{
            //     document.querySelector('#gridContainer').style.display = "block";
            //     if(document.querySelector('#spareContainer')){
            //         document.querySelector('#spareContainer').remove()
            //     }
            // }
            if(i.value == 'prods'){
                if(document.querySelector('#productSpec')){
                    document.querySelector('#productSpec').remove()
                }
                productTable();
            } else if(i.value == 'prodspec'){
                if(document.querySelector('#gridContainer') != null){
                    document.querySelector('#gridContainer').remove()
                }
                productSpecTable()
            }
        })
    })
})
function productTable(){
    let g = document.createElement('div');
    g.setAttribute("id", "gridContainer");
    document.querySelector('.product-manager').appendChild(g);

    const URL = '/api';

    const ordersStore = new DevExpress.data.CustomStore({
        key: 'product_id',
        load() {
        return sendRequest(`${URL}/productlist/`);
        },
        insert(values) {
          return sendRequest(`${URL}/productlist/`, 'POST', {
            values: JSON.stringify(values),
          });
        }
    })

    const brandStore = new DevExpress.data.CustomStore({
        key: 'id',
        loadMode: 'raw',
        load() {
            return sendRequest(`${URL}/brands/`);
        },
        // byKey: function (key) {
        //     let brand_data;
        //     fetch(`${URL}/brands/${key}/`)
        //         .then(res=>{
        //             brand_data = res
        //         })
        //     return brand_data;
        // }
    })

    $('#gridContainer').dxDataGrid({
        dataSource: ordersStore,
        allowColumnResizing:true,
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: true,
            allowDeleting: true,
            selectTextOnEditStart: true,
            startEditAction: 'click',
        },
        groupPanel: {
            visible: true,
        },
        filterRow: {
            visible: true,
        },
        export: {
            allowExportSelectedData: true,
            enabled: true,
        },
        onExporting(e) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Product_details');
      
            DevExpress.excelExporter.exportDataGrid({
              component: e.component,
              worksheet,
              autoFilterEnabled: true,
            }).then(() => {
              workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Product_details.xlsx');
              });
            });
            e.cancel = true;
        },
        onSaving(e) {
            e.cancel = true;
            
            if (e.changes.length) {
                let update_group = groupBy(e.changes, 'update')
                let remove_group = groupBy(e.changes, 'remove')
                let insert_group = groupBy(e.changes, 'insert')
                if(update_group.length){
                    e.promise = sendRequest(`${URL}/productdetail/`, 'PUT', update_group).then(() => {
                        e.component.refresh(true).done(() => {
                          e.component.cancelEditData();
                        });
                    });
                }
                if(remove_group.length){
                    e.promise = sendRequest(`${URL}/productdetail/`, 'DELETE', remove_group).then(() => {
                        e.component.refresh(true).done(() => {
                          e.component.cancelEditData();
                        });
                    });
                }
                if(insert_group.length){
                    e.promise = sendRequest(`${URL}/productlist/`, 'POST', insert_group).then(() => {
                        e.component.refresh(true).done(() => {
                          e.component.cancelEditData();
                        });
                    });
                }
            }
        },
        columns: [
            {dataField:'product_id', width:150, allowEditing: false,},
            {dataField:'name', caption: 'Product name'}, 
            {dataField: 'model_no'},
            {
                dataField:'brand.name',
                caption: 'Brand',
                // key: 'brand.id',
                // keyExpr: 'brand.id',
                lookup: {
                    dataSource: brandStore,
                    displayExpr: 'name',
                    valueExpr: 'name',
                }
            }
        ],
        showBorders: true,
    });

}

// Have to delete
function loadSpareTable(){
    g = document.createElement('div');
    g.setAttribute("id", "spareContainer");
    document.querySelector('.product-manager').appendChild(g)

    const URL = '/api';
    const YEARS = [2025, 2024, 2023, 2022,2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2003,2004, 2002, 2001, 2000]
    const ordersStore = new DevExpress.data.CustomStore({
        key: 'product_id',
        load() {
            let data = sendRequest(`${URL}/products/`);
            data.then((d)=> console.log(d))
            return data
        },
        insert(values) {
          return sendRequest(`${URL}/products/`, 'POST', {
            values: JSON.stringify(values),
          });
        }
    })

    $('#spareContainer').dxDataGrid({
        dataSource: ordersStore,
        allowColumnResizing:true,
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: false,
            allowDeleting: false,
            selectTextOnEditStart: true,
            startEditAction: 'click',
        },
        filterRow: {
            visible: true,
        },
        onSaving(e) {
            e.cancel = true;
            
            if (e.changes.length) {
                let update_group = groupBy(e.changes, 'update')
                let remove_group = groupBy(e.changes, 'remove')
                if(update_group.length){
                    e.promise = sendRequest(`${URL}/products/`, 'PUT', update_group).then(() => {
                        e.component.refresh(true).done(() => {
                          e.component.cancelEditData();
                        });
                    });
                }
                if(remove_group.length){
                    e.promise = sendRequest(`${URL}/products/`, 'DELETE', remove_group).then(() => {
                        e.component.refresh(true).done(() => {
                          e.component.cancelEditData();
                        });
                    });
                }
            }
        },
        columns: [
            {dataField:'product_id', width:150, allowEditing: false},
            // {dataField:'name', caption: 'Product name',allowEditing: false}, 
            {dataField: 'model_no'},
            {
                dataField: 'spare_battery.property.property_value',
                caption: 'Battery(in MAH)',
            },
            {
                dataField:'spare_charger.release_year',
                caption: 'Charger year (in years)',
                // key: 'brand.id',
                // keyExpr: 'brand.id',
                lookup:{
                    dataSource: YEARS
                }
            },
            {
                dataField: 'spare_charger.variety_name',
                caption: 'Charger port type',
                lookup:{
                    dataSource: ['V8', 'TYPE C']
                }
            },{
              allowExporting:true,
            }
        ],
    })

}
async function sendRequest(url, method = 'GET', data) {
    const csrftoken = getCookie('csrftoken'); 
    if(method == 'DELETE'){
        let res = await fetch(url, {
            method: method,
            body: JSON.stringify(data),
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        })
        if(res.ok){
            let data = await res.json()
            return data
        }
    }
    let res = await fetch(url, {
                method: method,
                body: JSON.stringify(data),
                headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
            })
            if(res.ok){
                let data = await res.json()
                
                return data
            }

}
var groupBy = function(data, key) {
    return data.filter(each => each.type == key)
};

// Product spec table
function productSpecTable(){
    g = document.createElement('div');
    g.setAttribute("id", "productSpec");
    document.querySelector('.product-manager').appendChild(g)
    const URL = '/api';
    const YEARS = [2025, 2024, 2023, 2022,2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2003,2004, 2002, 2001, 2000]
    const ordersStore = new DevExpress.data.CustomStore({
        key: 'product_id',
        load() {
            let data = sendRequest(`${URL}/products/`);
            data.then((d)=> console.log(d))
            return data
        },
        insert(values) {
          return sendRequest(`${URL}/products/`, 'POST', {
            values: JSON.stringify(values),
          });
        }
    })

    $('#productSpec').dxDataGrid({
        dataSource: ordersStore,
        allowColumnResizing:true,
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: false,
            allowDeleting: true,
            selectTextOnEditStart: true,
            startEditAction: 'click',
        },
        groupPanel: {
            visible: true,
        },
        filterRow: {
            visible: true,
        },
        export: {
            allowExportSelectedData: true,
            enabled: true,
        },
        onExporting(e) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Product_specs');
      
            DevExpress.excelExporter.exportDataGrid({
              component: e.component,
              worksheet,
              autoFilterEnabled: true,
            }).then(() => {
              workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Product_specs.xlsx');
              });
            });
            e.cancel = true;
        },
        onSaving(e) {
            e.cancel = true;
            
            if (e.changes.length) {
                let update_group = groupBy(e.changes, 'update')
                let remove_group = groupBy(e.changes, 'remove')
                if(update_group.length){
                    e.promise = sendRequest(`${URL}/products/`, 'PUT', update_group).then(() => {
                        e.component.refresh(true).done(() => {
                          e.component.cancelEditData();
                        });
                    });
                }
                if(remove_group.length){
                    e.promise = sendRequest(`${URL}/products/`, 'DELETE', remove_group).then(() => {
                        e.component.refresh(true).done(() => {
                          e.component.cancelEditData();
                        });
                    });
                }
            }
        },
        columns: [
            {dataField:'product_id', width:150, allowEditing: false},
            // {dataField:'name', caption: 'Product name',allowEditing: false}, 
            {dataField: 'model_no'},
            {
                dataField: 'spare_display.type.type',
                caption: 'Display type',
                lookup:{
                    dataSource: ['LED', 'LCD']
                }
            },
            {
                dataField: 'spare_battery.property.property_value',
                caption: 'Battery(in MAH)',
            },
            {
                dataField:'release_year',
                caption: 'Released (in years)',
                // key: 'brand.id',
                // keyExpr: 'brand.id',
                lookup:{
                    dataSource: YEARS
                }
            },
            {
                dataField: 'spare_charger.variety_name',
                caption: 'Charger port type',
                lookup:{
                    dataSource: ['V8', 'TYPE C']
                }
            },
          
        ]
    })
}