let spareData = new Array();
let spareCostingMethods = new Array();

class CustomTextEditor {
  constructor(props) {
    const el = document.createElement('input');
    const { maxLength } = props.columnInfo.editor.options;

    el.type = 'text';
    el.maxLength = maxLength;
    el.value = String(props.value);

    this.el = el;
  }

  getElement() {
    return this.el;
  }

  getValue() {
    return this.el.value;
  }

  mounted() {
    this.el.select();
  }
}

function tableData(){
  fetch('/api/spares/', {
    method: 'GET',
    mode: 'same-origin',
  }).then(res=>res.json()).then(data=>{
    for(value of data){
      spareData.push({
        "productName": value.spare.varient.product.name + '-' + value.spare.varient.variant_name,
        "spareName": value.spare.name,
        "quality":value.quality,
        "retail": value.purchase_price,
        "dealer": value.dealer_price,
        "pricingMethod": value.spare_costing.spare_costing_name,
        "discount": value.spare_discount.discount_name
      })
    }
    grid.resetData(spareData)
  }).catch(err=>console.log(err))
}

tableData();
/******* Getting all pricing method *******/
fetch('/api/sparecostingmethods/',{
  method: 'GET',
  mode: 'same-origin'
}).then(res=>res.json())
  .then(data=>{
    for(let value of data){
      spareCostingMethods.push({
        "text": value.spare_costing_name,
        "value": value.spare_costing_name
      })
    }
  })
  .catch(err=>console.log(err))
options = {
    el: document.getElementById('grid'),
    data: spareData,
    scrollX: false,
    scrollY: false,
    columns: [
      {
        header: 'Product Name',
        name: 'productName',
        sortable: true,
        editor: 'text'
      },
      {
        header: 'Spare Name',
        name: 'spareName',
        sortable: true,
        editor: 'text'
      },
      {
        header: 'Quality',
        name: 'quality',
        sortable: true,
      },
      {
        header: 'Retail Price',
        name: 'retail',
        sortable: true
      },
      {
        header: 'Dealer Price',
        name: 'dealer',
        sortable: true
      },
      {
        header: 'Pricing Method',
        name: 'pricingMethod',
        sortable: true,
        copyOptions: {
          useListItemText: true
        },
        editor: {
          type: 'radio',
          options: {
            listItems: spareCostingMethods
          }
        }
      },
      {
        header: 'Discount',
        name: 'discount',
        sortable: true
      }
    ]
  };

function getProductList(){
  let products = []
  fetch('/api/productlist/', {
    method: 'GET',
    mode: 'same-origin'
  }).then(res=>res.json()).then(data=>{
    for(let value of data){
      products.push(value.name)
    }
  })
  return products
}
function getModelList(){
  let variants = []
  fetch('/api/variants/', {
    method: 'GET',
    mode: 'same-origin'
  }).then(res=>res.json()).then(data=>{
    for(let value of data){
      variants.push(value.variant_name)
    }
  })
  return variants
}
function getSubcategory(){
  let sub_category = []
  fetch('/api/subcategory/',{
    method:'GET',
    mode: 'same-origin',
  }).then(res=>res.json()).then(data=>{
    for(let value of data){
      sub_category.push(value.name)
    }
  })
}

function toggleSideNav(){
  grid.refreshLayout();
}
$('.toggle-icon').on('click', function () {
  grid.refreshLayout();
})
/***** Product name Autocomplete *****/
const productName = new autoComplete({ 
  selector: "#productName",
  placeHolder: "",
  data: {
    src: getProductList(),
    cache: true
  },
  resultItem: {
    highlight: {
      render: true
    }
  },
  events: {
    input: {
        selection: (event) => {
            const selection = event.detail.selection.value;
            productName.input.value = selection;
        }
    }
  }
 })
 $(document).ready(function(){
   grid.prependRow()
 })
 /***** Model name Autocomplete *****/
const modelName = new autoComplete({ 
  selector: "#modelName",
  placeHolder: "",
  data: {
    src: getModelList(),
    cache: true
  },
  resultItem: {
    highlight: {
      render: true
    }
  },
  events: {
    input: {
        selection: (event) => {
            const selection = event.detail.selection.value;
            modelName.input.value = selection;
        }
    }
  }
 })

/*****Submit new spare *****/
var newSpare = new bootstrap.Modal(document.getElementById("newSpare"), {});
var subcategory = new bootstrap.Modal(document.getElementById("subcategory"), {});

document.getElementById('newSpareForm').onsubmit = async (e) =>{
  let spareData = new FormData(newSpareForm);
  e.preventDefault();
  fetch('/checkproductexistance/',{
    method:'POST',
    mode: 'same-origin',
    body: spareData
  }).then(res=>res.json()).then(data=>{
    if(data.res == false){
      subcategory.show();
      // newSpare.hide();
      document.getElementById('subcategoryform').onsubmit = async (e) =>{
        e.preventDefault();
        spareData.append('subcategory', subCategorySelect.value)
        fetch('/newspare/', {
          method: 'POST',
          mode: 'same-origin',
          body: spareData,
        }).then(res=>res.json()).then(data=>{
          if(data.res == true){
            subcategory.hide();
            newSpare.hide();
            resetNewSpareForm();
            // Reset Table Data
            fetch('/api/spares/', {
              method: 'GET',
              mode: 'same-origin',
            }).then(res=>res.json()).then(data=>{
              for(value of data){
                spareData.push({
                  "productName": value.spare.varient.product.name + '-' + value.spare.varient.variant_name,
                  "spareName": value.spare.name,
                  "quality":value.quality,
                  "retail": value.purchase_price,
                  "dealer": value.dealer_price,
                  "pricingMethod": value.spare_costing.spare_costing_name,
                  "discount": value.spare_discount.discount_name
                })
              }
              grid.resetData(spareData)
            }).catch(err=>console.log(err))

            Swal.fire(
              'Success!',
              'New spare added successfully',
              'success'
            )
          }
        }).catch(err=>console.log(err))
      }
    }else{
      spareData.append('subcategory', '')
      fetch('/newspare/', {
        method: 'POST',
        mode: 'same-origin',
        body: spareData,
      }).then(res=>res.json()).then(data=>{
        if(data.res == true){
          newSpare.hide();
          resetNewSpareForm();
          // Reset table Data
          fetch('/api/spares/', {
            method: 'GET',
            mode: 'same-origin',
          }).then(res=>res.json()).then(data=>{
            for(value of data){
              spareData.push({
                "productName": value.spare.varient.product.name + '-' + value.spare.varient.variant_name,
                "spareName": value.spare.name,
                "quality":value.quality,
                "retail": value.purchase_price,
                "dealer": value.dealer_price,
                "pricingMethod": value.spare_costing.spare_costing_name,
                "discount": value.spare_discount.discount_name
              })
            }
            grid.resetData(spareData)
          }).catch(err=>console.log(err))

          Swal.fire(
            'Success!',
            'New spare added successfully',
            'success'
          )
        }
      }).catch(err=>console.log(err))
    }
  }).catch(err=>console.log(err))
}
const grid = new tui.Grid(options)

function resetNewSpareForm(){
  document.getElementById('productName').value = '';
  document.getElementById('modelName').value = '';
  document.getElementById('purchasePrice').value = '';
  $('#sparename option').prop('selected', function() {
    return this.defaultSelected;
  });
  $('#quality option').prop('selected', function() {
    return this.defaultSelected;
  });
  $('#spareCosting option').prop('selected', function() {
    return this.defaultSelected;
  });
  $('#discount option').prop('selected', function() {
    return this.defaultSelected;
  });
  $('#subCategorySelect option').prop('selected', function() {
    return this.defaultSelected;
  });
}