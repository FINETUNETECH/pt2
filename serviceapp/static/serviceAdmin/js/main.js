let newdata = [{
    'brand': '',
    'product': '',
    'issue': '',
}];
// Hiding the input fields
$('.brandInput').hide();
$('.modelInput').hide();
$('.modelnoInput').hide();

function calculateCCBoard(release_year, type){
    const current_year = new Date().getFullYear()
    if((current_year - release_year)<= 3 && type.toLowerCase() == 'type c'){ // New Type c
        return 400

    } else if((current_year - release_year)> 3 && type.toLowerCase() == 'type c'){ //OLD Type c
        return 200

    } else if((current_year - release_year)<= 3 && type.toLowerCase() == 'v8'){ //NEW V8
        return 200

    } else if((current_year - release_year)> 3 && type.toLowerCase() == 'v8'){ // OLD V8
        return 250
    }
}

function calculateChargerPrice(release_year, name){
    const current_year = new Date().getFullYear()
    if((current_year - release_year)<= 3 && name.toLowerCase() == 'type c'){ // New Type c
        return 450

    } else if((current_year - release_year)> 3 && name.toLowerCase() == 'type c'){ //OLD Type c
        return 450

    } else if((current_year - release_year)<= 3 && name.toLowerCase() == 'v8'){ //NEW V8
        return 350

    } else if((current_year - release_year)> 3 && name.toLowerCase() == 'v8'){ // OLD V8
        return 300
    }
}
// Updating the booking
// Retriving booking details
class OrderSummary{
    constructor (data = null, total_payment, advance_payment, issue, products, brand, selected_display, other_issue){
        this.total_payment = parseFloat(total_payment)
        this.advance_payment = parseFloat(advance_payment)
        if($('.selectedissuetext').val().length){
            this.issue = $('.selectedissuetext').val()
        }else{
            this.issue = issue
        }
        this.product = products
        this.brand = brand
        this.other_issue = other_issue
        this.selected_display = selected_display
        this.data = data
    }
    addOtherIssue(issue, value, id){
        this.other_issue.push({
            'id': id,
            'other_issue': issue,
            'other_issue_value': value
        })
    }
    removeOtherIssue(id){
        this.other_issue.splice(this.other_issue.findIndex(e=>parseInt(e['id']) == parseInt(id)),1)
    }
    async getSpare(product, issue){
        let product_name, spare_details, model;
        let brand = this.brand;
        
        if(product.includes("|")){
            const split_name = product.split('|')
            
            product_name = split_name[0]
            model = split_name[1]
        }else{
            product_name= product
        }
        let spare_res = await fetch(`/api/getprice/${product_name}/${issue}?model=${model}`, {method:'GET'})
        if(spare_res.ok){
            return await spare_res.json()
        }
    }
    async OtherTotal(){
        let other_total = 0
        if(this.other_issue.length){
            this.other_issue.map((e,i)=>{
                other_total += parseFloat(e.other_issue_value)
            })
            return other_total
        } else{
            return other_total
        }
    }
    async displayTotal(){

        let display_total = 0

        if($('[data-issue-selected=selected_issues]').val().includes('Display')){
            const selected_input = $('[data-display-selected=display_selected] option:selected').attr('data-token');
            if(selected_input != undefined){
                display_total += parseFloat(selected_input)
            }else{
                display_total += parseFloat(this.selected_display)
            }
            return display_total
        } else{
            return display_total
        }
    }
    async chargerTotal(){
        let charger_total = 0
        let check_charger_availability = this.data['selected_spare'].filter((e,i)=>{
            return e['spare_name']['name'].toLowerCase() === "charger port"
        })
        if(check_charger_availability.length){
            if($('[data-issue-selected=selected_issues]').val().includes('Charger Port')){
                const charger_port_details = await this.getSpare(this.product, 'Charger Port')
                if(charger_port_details.length === 0) {
                    return charger_total
                }else{
                    if(this.data['is_charger_cc_board']){
                        const cc_board_rate = calculateCCBoard(charger_port_details[0].product.release_year, charger_port_details[0].spare_variety[0].variety_name)
                        charger_total += parseFloat(cc_board_rate)
                    }
                    const charger_rate = calculateChargerPrice(charger_port_details[0].product.release_year, charger_port_details[0].spare_variety[0].variety_name)
                    charger_total += parseFloat(charger_rate)
                    
                    return charger_total
                }
            }else{
                return charger_total;
            }
        }else{
            return charger_total;
        }
    }
    async batteryTotal(){
        console.log(this.data)
        let battery_total = 0;
        let check_battery_availability = this.data['selected_spare'].filter((e,i)=>{
            return e['spare_name']['name'].toLowerCase() === "battery"
        })
        if(check_battery_availability.length){
            if($('[data-issue-selected=selected_issues]').val().includes('Battery')){
                const battery_details = await this.getSpare(this.product, 'Battery')
    
                if(battery_details.length === 0) {
                    return battery_total;
                }else{
                    const battery_rate = parseFloat(battery_details[0].spare_variety[0].property.property_value) * 0.25
                    battery_total += battery_rate
                    this.data['service_charge'] ? battery_total += 200 : battery_total
                    return battery_total
                }
            }else{
                return battery_total
            }
        }else{
            return battery_total
        }
    }
    async calculateChangeTotalAmount(){
        let total = 0
        if( $('.edit-selected-spare').length){
            $('.edit-selected-spare:checked').each((i,e)=>{
                total += parseInt($(e).val())
            })
            total += await this.OtherTotal()

        }else{
            total += await this.OtherTotal() + await this.displayTotal() + await this.chargerTotal() + await this.batteryTotal()
        }

        return total
    }
    async calculateTotalAmount(){
        let total = 0;

        total += await this.OtherTotal() + await this.displayTotal() + await this.chargerTotal() + await this.batteryTotal()
        console.log(total)
        return total
        
    }
    async balancePayment(){
        const bal_payment = await this.calculateChangeTotalAmount() - this.advance_payment
        return bal_payment;
    }
    async changeBalancePayment(){
        const bal_payment = await this.calculateChangeTotalAmount() - this.advance_payment
        return bal_payment;
    }
}
// Getting URL Parameters
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};

$(document).ready(function(){
    if(getUrlParameter('edit_tab')){
        var someTabTriggerEl = document.querySelector('#edit_spare_tab')
        var tab = new bootstrap.Tab(someTabTriggerEl)

        tab.show()
    }
})
$(document).on('change', '#brandInput', function(){
    newdata[0]['brand'] = $(this).val()
})
$(document).on('change', '#productInput', function(){
    if($(this).data('product') != '' && $(this).data('model') != ''){
        newdata[0]['product']=$(this).data('product')
        newdata[0]['model']=$(this).data('model')
    }else{
        newdata[0]['product']=$(this).val()
    }
})
$(document).on('change', '#issueselect', function(){
    newdata[0]['issue']= $(this).val()
})
// resetting the product field on changing the brand
$(document).on('keyup','#brandInput', function(){
    if($(this).val() == ''){
        $('#productInput').val('');
    }
})
$(document).on('change','.edit-brand-ip', function(){
    if($(this).val() == ''){
        $('.edit-product-ip').val('');
    }
})
// Edit Brand name
$(document).on('click','.brand', function(){
    $(this).siblings('.brandInput').show().focus();
    $(this).hide();
    $(this).siblings('.brandInput').on('blur',function(){
        if($(this).val() != ''){
            $(this).css('border', '1px solid #ced4da')
            value = $(this).val()
            $(this).siblings('.brand').html(value);
            $(this).hide();
            $(this).siblings('.brand').show();
        }else{
            $(this).css('border', '1px solid red')
        }
    })
})

$(document).on('click','.model', function(){
    $(this).siblings('.modelInput').show().focus();
    $(this).hide();
    $(this).siblings('.modelInput').on('blur',function(){
        if($(this).val() != ''){
            $(this).css('border', '1px solid #ced4da')
            value = $(this).val()
            $(this).siblings('.model').html(value);
            $(this).hide();
            $(this).siblings('.model').show();
        }else{
            $(this).css('border', '1px solid red')
        }
    })
})
$(document).on('click','.modelno', function(){
    if($(this).siblings('.brandInput').val() == ''){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please Enter Brand!'
        })
        return false;
    }
    $(this).siblings('.modelnoInput').show().focus();
    $(this).hide();
    $(this).siblings('.modelnoInput').on('blur',function(){
        
        if($(this).val() != ''){
            $(this).css('border', '1px solid #ced4da')
            
            value = $(this).val()
            let brand = $(this).siblings('.brand').text();
            $(this).siblings('.modelno').html(value);
            $(this).hide();
            $(this).siblings('.modelno').show();
            // fetching and filling the product field if available
            fetch(`/api/productdetail/${value}/${brand}/`,{
                method: 'GET'
            }).then(res=>res.json()).then(data=>{
                
                $(this).siblings('.model').html(data[0].name);
                $(this).siblings('.modelInput').val(data[0].name)
            }).catch(err=>console.log(err))
        }else{
            $(this).css('border', '1px solid red')
        }
    })
})
$(document).on('submit', '#price_list',function(e) {
    e.preventDefault();
    $('#getPrice').html(`<img src="../../../static/serviceAdmin/img/loader.svg" height="30" width="30" alt="">`)
    $('#getPrice').prop("disabled", true)
    const td = setTimeout(()=>{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong!'
        })
        $('#getPrice').html(`Get Price`)
        $('#getPrice').prop("disabled", false)
    },3000)
    let product_model = $('#productInput').val().split("|")
    // Getting value from input and using fetch
    if(product_model[1]){
        let model = product_model[1].trim()
        fetch(`/api/getprice/${product_model[0]}/${newdata[0]['issue']}/?model=${model}`, {
            method: 'GET',
        }).then(res=>res.json()).then(data=>{
            $('#getPrice').html(`Get Price`)
            $('#getPrice').prop("disabled", false)
            let date;
            if(data[0]){
                date = new Date(data[0].date_updated)
            }
            if(data != '' && data[0].spare_variety.length != 0){
                $('.show-div').html(`
                    <div class="card-body">
                        <h2>${data[0].product.brand.name}</h2>
                        <div class="position-absolute end-0 top-0 mt-2 me-2 text-muted">
                            <p class="m-0">Last Updated</p>
                            ${date.getDate()} - ${date.getMonth() + 1} - ${date.getFullYear()}
                        </div>
                        <p>${data[0].product.name}</p>
                        <ul class="spare_variety list-unstyled"></ul>
                    </div>
                `)
                if(data[0].name === 'Display' || data[0].name === 'display'){
                    for(variety of data[0].spare_variety){
                        $('.spare_variety').append(`
                                <li><b> ${variety.quality.quality}</b> - ₹${variety.purchase_price}</li>
                        `)
                    }
                }else if(data[0].name === 'Battery'){
                    for(variety of data[0].spare_variety){
                        $('.spare_variety').append(`
                                <li><b> ${variety.property.property_value} ${variety.property.property_unit}</b> - ₹${variety.purchase_price}</li>
                        `)
                    }
                }
            }else{
                saveRequest()
                $('.show-div').html(`
                <p class="text-center"> Sorry price not available & <span class="text-success"><b class="fs-1"> We are sending your request..</b></p>
             
            `)}
           clearTimeout(td);
        }).catch(err=>console.log(err));
    } else{
        fetch(`/api/getprice/${product_model[0]}/${newdata[0]['issue']}/?model=${newdata[0]['model']}`, {
            method: 'GET',
        }).then(res=>res.json()).then(data=>{
            $('#getPrice').html(`Get Price`)
            $('#getPrice').prop("disabled", false)
            if(data != ''){
                $('.show-div').html(`
                    <div class="card-body">
                        <h2>${data[0].product.brand.name}</h2>
                        ${data[0].date_updated}
                        <p>${data[0].product.name}</p>
                        <ul class="spare_variety list-unstyled"></ul>
                    </div>
                `)
                for(variety of data[0].spare_variety){
                    $('.spare_variety').append(`
                            <li><b> ${variety.quality.quality}</b> - ₹${variety.purchase_price}</li>
                    `)
                }
            }else{
                saveRequest()
                $('.show-div').html(`
                <p class="text-center"> Sorry price not available & <span class="text-success"><b> we are sending your request.. </b></p>
             
            `)}
           clearTimeout(td);
        }).catch(err=>console.log(err));
    }
})
async function sparedatachange(spare_name, product_name, model_num, data=null) {
    $('.spares-list-edit').html("")
    const dis_res = await fetch(`/api/getprice/${product_name}/${spare_name}/?model=${model_num}`, {
        method: 'GET',
    })
    if(dis_res.ok){
        const dis_data = await dis_res.json();
        if(spare_name == 'Display'){

            $('.spares-list-edit').html(`
                <select id="display_spare_edit" class="form-select js-example-basic-multiple display_spare" data-display-selected="display_selected" name="display_spare" disabled>
                   
                </select>
            `)
            dis_data[0].spare_variety.map((each,i)=>{
                    $('#display_spare_edit').append(`
                        <option value="${each.id}" data-token="${each.purchase_price}" data-id="${each.quality.id}">${each.quality.quality} - ₹ ${each.purchase_price}</option>
                    `)
                    
            })
            if(data != null){
                dis_data[0].spare_variety.map((each,i)=>{
        
                    data.selected_spare.map((each_selected_spare, i)=>{

                        if(each_selected_spare.quality !=null){
                            if(each_selected_spare.quality.id == each.quality.id){
                                $(`#display_spare_edit option[data-id=${each.quality.id}]`).attr('selected', true)
                            }
                        }
                    })
                })
            }
        }
        // dis_data[0].spare_variety.map((each,i)=>{
        //     $('#display_spare_edit').append(`
        //         <option value="${each.quality.quality}">${each.quality.quality}</option>
        //     `)
        // })
       
    }
}

$(document).on('click','.spare-submit', function(e){
    e.preventDefault()
    data = []
    $(this).html(`<img src="../../../static/serviceAdmin/img/loader.svg" height="30" width="30" alt="">`)
    $(this).attr("disabled", 'disabled')
    let model = $(this).parent().parent().siblings().find('.modelInput').val()
    let brand = $(this).parent().parent().siblings().find('.brandInput').val()
    let modelno = $(this).parent().parent().siblings().find('.modelnoInput').val()
    let spare = $(this).parent().parent().siblings().find('.request_issue').text()
    let user = $(this).parent().parent().siblings().find('.user_name').val()
    let display_type;
    // Checking the spare type for getting the spare type
    if($(this).parents().parents().siblings().find('.request_issue').html().toLowerCase() == 'display'){
        display_type = $(this).parent().parent().siblings().find('.display_type').val()
    }
    // validating model no
    if(modelno == ''){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter model number!'
        })
        $(this).html(`Add`)
        $(this).prop("disabled", false)
        return false;
    }
    if(model == ''){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter Model!'
        })
        $(this).html(`Add`)
        $(this).prop("disabled", false)
        return false;
    }
    if(brand == ''){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter Brand!'
        })
        $(this).html(`Add`)
        $(this).prop("disabled", false)
        return false;
    }
    if(display_type && $(this).attr('data-edit') != 'true'){
        data.push({'model':model, 'brand': brand, 'spare':spare ,user: user,'modelno': modelno, display_type:display_type, quality_set:[]})
    } else if($(this).attr('data-edit')== 'true'){
        let brand_id = $(this).parent().parent().siblings().find('.brandInput').data('id')
        let model_id = $(this).parent().parent().siblings().find('.modelInput').data('id')
        data.push({'model':model, 'brand': brand, 'spare':spare ,user: user,'modelno': modelno, display_type:display_type,'brand_id':brand_id,'model_id': model_id, quality_set:[]})
    }
    else{
        data.push({'model':model, 'brand': brand, 'spare':spare ,user: user,'modelno': modelno, display_type: null, quality_set:[]})
    }
    
    elements = []
    $.each($(this).parent().siblings('.quality-input'), function(i,e){
        elements.push({
            'quality': $(e).find('.quality').val(),
            'price': $(e).find('.price').val()
        });
    });
    data[0].quality_set.push(elements)
    td = setTimeout(()=>{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong!'
        })
        $(this).html(`Add`)
        $(this).prop("disabled", false)
    },6000)
    // Editing spare
    if($(this).attr('data-edit')== 'true'){
        // Edit Spare
        fetch(`/saveprice/?id=${$(this).siblings('.id').text()}&&edit=${true}`,{
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res=>res.json()).then(data=>{
    
            Swal.fire({
                icon: 'success',
                title: 'Changes saved',
                text: 'Successfully saved your changes!'
            })
            // Refreshing the data with the updated values
            let product_input = model
            let issue_input = $('.issueselect').val()
            let brand_input = brand
            $('#brandInput').val(brand_input)
            fetchSpares(brand_input, product_input, issue_input)
            clearTimeout(td);
        }).catch(err=>console.log(err));
    } else{
        // New Spare
        fetch(`/saveprice/?id=${$(this).siblings('.id').text()}`,{
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res=>res.json()).then(data=>{
    
            if(data.success == 'true'){
                $(this).closest('.card').parent().fadeOut();
            }
            clearTimeout(td);
        }).catch(err=>console.log(err));
    }
   
})
// Updated spare price request
$(document).on('click', '.spare-submit-2', function(e){
    e.preventDefault()
    data = []
    $(this).html(`<img src="../../../static/serviceAdmin/img/loader.svg" height="30" width="30" alt="">`)
    $(this).attr("disabled", 'disabled')
    let model = $(this).parent().parent().siblings().find('.modelInput').val()
    let brand = $(this).parent().parent().siblings().find('.brandInput').val()
    let modelno = $(this).parent().parent().siblings().find('.modelnoInput').val()
    // let spare = $(this).parent().parent().siblings().find('.request_issue').text()
    let user = $(this).parent().parent().siblings().find('.user_name').val()
    display_type = $(this).parent().parent().siblings().find('.display_type').val()
    charger_type = $(this).parent().parent().siblings().find('.charger_port_type').val()

    // validation
    if(modelno == ''){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter model number!'
        })
        $(this).html(`Add`)
        $(this).prop("disabled", false)
        return false;
    }
    if(model == ''){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter Model!'
        })
        $(this).html(`Add`)
        $(this).prop("disabled", false)
        return false;
    }
    if(brand == ''){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter Brand!'
        })
        $(this).html(`Add`)
        $(this).prop("disabled", false)
        return false;
    }
    
    // initializing the common data
    data.push({'model':model, 'brand': brand,user: user,'modelno': modelno, display_type:display_type, quality_set:[]})

    // Display data
    elements = []
    $.each($(this).parent().siblings('.quality-input'), function(i,e){
        elements.push({
            'quality': $(e).find('.quality').val(),
            'price': $(e).find('.price').val()
        });
    });
    data[0].quality_set.push(elements)
    
    // Battery data
    data.push({'battery': $(this).parent().siblings('.mah-input').find('.battery_mah').val()})

    // Release year
    data.push({'release_year': $(this).parent().siblings('.year-input').find('.release_year').val(), 'charger_type': charger_type})

    // Saving the data
    // Editing spare
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 
    if($(this).attr('data-edit')== 'true'){
        // Edit Spare
        fetch(`/saveprice-updated/?id=${$(this).siblings('.id').text()}&&edit=${true}`,{
            method: 'POST',
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
            body: JSON.stringify(data)
        }).then(res=>res.json()).then(data=>{
    
            Swal.fire({
                icon: 'success',
                title: 'Changes saved',
                text: 'Successfully saved your changes!'
            })
            // Refreshing the data with the updated values
            let product_input = model
            let issue_input = $('.issueselect').val()
            let brand_input = brand
            $('#brandInput').val(brand_input)
            fetchSpares(brand_input, product_input, issue_input)
            clearTimeout(td);
        }).catch(err=>console.log(err));
    } else{
        // New Spare
        fetch(`/saveprice-updated/?id=${$(this).siblings('.id').text()}`,{
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res=>res.json()).then(data=>{
    
            if(data.success == 'true'){
                $(this).closest('.card').parent().fadeOut();
            }
            clearTimeout(td);
        }).catch(err=>console.log(err));
    }
})
$(document).on('click', '.new-btn', function(){
    $(`
        <div class="row quality-input g-0">
            <div class="col-6 g-1">
                <input type="text" class="form-control form-control-sm quality" id="" placeholder="Quality">
            </div>
            <div class="col-6 g-1">
                <input type="number" class="form-control form-control-sm price" id="" placeholder="Price" min="1">
            </div>
        </row>
    `).insertBefore(this);
})

function saveRequest(){
    fetch('/request/', {
        method: 'POST',
        body: JSON.stringify(newdata),
    }).then(res=>res.json()).then(data => {
        if(data.success == 'true'){
            $('#brandInput').val('')
            $('#productInput').val('')
            $('#issueselect').val('')
            $('.show-div').html('')
            Swal.fire(
                'Good job!',
                'You successfully sent request!',
                'success'
            )
        }
    }).catch(err=>console.log(err));
}
let brands = []
// Get all Brands
fetch('/api/brands/').then(res=>res.json()).then(data=>{
    data.map((i,e)=>{
        brands.push(i.name)
    })
})
// Autocomplete
const brandAuto = new autoComplete({
    selector: "#brandInput",
    data: {
        src: brands,
        cache: true,
    },
    searchEngine: "loose",
    resultsList: {
        class: "text-capitalize",
        element: (list, data) => {
            if (!data.results.length) {
                // Create "No Results" message element
                const message = document.createElement("div");
                // Add class to the created element
                message.setAttribute("class", "no_result");
                // Add message text content
                message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                // Append message element to the results list
                list.prepend(message);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                brandAuto.input.value = selection;
            }
        }
    }
})
// Brand Autocomplete class
const secBrandAuto = new autoComplete({
    selector: ".edit-brand-ip",
    data: {
        src: brands,
        cache: true,
    },
    searchEngine: "loose",
    resultsList: {
        class: "text-capitalize",
        element: (list, data) => {
            if (!data.results.length) {
                // Create "No Results" message element
                const message = document.createElement("div");
                // Add class to the created element
                message.setAttribute("class", "no_result");
                // Add message text content
                message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                // Append message element to the results list
                list.prepend(message);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                secBrandAuto.input.value = selection;
            }
        }
    }
})
// Checking whether Brand is filled on entering product
$('#productInput').on('input', function(){
    if($('#brandInput').val() == ''){
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'Please Enter Brand!',
        })
        $(this).val('');
    }
})

$('.edit-product-ip').on('input', function(){
    if($('.edit-brand-ip').val() == ''){
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'Please Enter Brand!',
        })
        $(this).val('');
    }
})
function fetchProducts(){
    let products = []
    let alldata;
    if($('#brandInput').val() != ''){
        // Get all Products
        alldata = fetch(`/api/productlist/?brand=${$('#brandInput').val()}`).then(res=>res.json()).then(data=>{
            data.map((i,e)=>{
                if(i.model_no){
                    products.push({'value': `${i.name}|${i.model_no}`, 'product':`${i.name}` , 'model': `${i.model_no}`})
                }else{
                    products.push({'value': `${i.name}`, 'product':`${i.name}`, 'model': ``})
                }
            })
            return products;
        })
    }
    return alldata
}
function secfetchProducts(){
    let products = []
    let alldata;
    if($('.edit-brand-ip').val() != ''){
        // Get all Products
        alldata = fetch(`/api/productlist/?brand=${$('.edit-brand-ip').val()}`).then(res=>res.json()).then(data=>{
            data.map((i,e)=>{
                if(i.model_no){
                    products.push({'value': `${i.name}|${i.model_no}`, 'product':`${i.name}` , 'model': `${i.model_no}`})
                }else{
                    products.push({'value': `${i.name}`, 'product':`${i.name}`, 'model': ``})
                }
            })
            return products;
        })
    }
    return alldata
}
// Product Auto complete
const productAuto = new autoComplete({
    selector: '#productInput',
    data: {
        src: async (query)=>{
            document.getElementById("productInput")
            const data = fetchProducts()
            return data;
        },
        keys: ["value"],
        cache: false,
    },
    searchEngine: "strict",
    resultsList: {
        maxResults: 10,
        class: "text-capitalize",
        element: (list, data) => {
            if (!data.results.length) { 
                // Create "No Results" message element
                const message = document.createElement("div");
                // Add class to the created element
                message.setAttribute("class", "no_result text-capitalize");
                // Add message text content
                message.innerHTML = `<span>Found No Results for "${data.query.toUpperCase()}"</span>`;
                // Append message element to the results list
                list.prepend(message);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                productAuto.input.value = selection.value;
                $(productAuto.input).data('product', selection.product)
                $(productAuto.input).data('model', selection.model)
            }
        }
    }
})
// secondary Product Auto complete
const secProductAuto = new autoComplete({
    selector: '#bookedProduct',
    data: {
        src: async (query)=>{
            document.getElementById("bookedProduct")
            const data = secfetchProducts()
            return data;
        },
        keys: ["value"],
        cache: false,
    },
    searchEngine: "strict",
    resultsList: {
        class: "text-capitalize",
        maxResults: 10,
        element: (list, data) => {
            if (!data.results.length) { 
                // Create "No Results" message element
                const message = document.createElement("div");
                // Add class to the created element
                message.setAttribute("class", "no_result text-capitalize");
                // Add message text content
                message.innerHTML = `<span>Found No Results for "${data.query.toUpperCase()}"</span>`;
                // Append message element to the results list
                list.prepend(message);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                secProductAuto.input.value = selection.value;
                $(secProductAuto.input).data('product', selection.product)
                $(secProductAuto.input).data('model', selection.model)
            }
        }
    }
})
// fetch Notications
fetch('/user/notifications/', {
    method:'GET'
}).then(res=>res.json()).then(data=>{
    data.map((i,e)=>{
        date = new Date(i.date_created)
        today = new Date()
        difference = timeDifference(today, date);
        $('.header-notifications-list').append(`
            <a class="dropdown-item notifications mb-1" href="#" data-id=${i.id}>
            <div class="d-flex align-items-center">
            <div class="notification-box bg-light-primary text-primary"><i class="bi bi-basket2-fill"></i></div>
            <div class="ms-3 flex-grow-1">
                <h6 class="mb-0 dropdown-msg-user">${i.notification_heading} <span class="msg-time float-end text-secondary">${difference}</span></h6>
                <small class="mb-0 dropdown-msg-text text-secondary d-flex align-items-center">${i.notification_content}</small>
            </div>
            </div>
        </a>
        `)
        if(i.is_read == false){
            $('.notifications').addClass('bg-blue');
        }
    })
}).catch(err=>console.log(err))

$(document).on('click', '.notifications', function(){
    let id = $(this).data('id');
    data = [{
        is_read: true
    }]
    fetch(`/user/notifications/${id}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }).then(res=>res.json()).then(data=>console.log(data)).catch(err=>console.log(err));
})

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' s';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' m';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' h';   
    }

    else if (elapsed < msPerMonth) {
        return 'approximately ' + Math.round(elapsed/msPerDay) + ' days';   
    }

    else if (elapsed < msPerYear) {
        return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months';   
    }

    else {
        return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years';   
    }
}

// $("#staff").on('change', function() {
//     if ($(this).is(':checked')) {
//       $(this).attr('value', 'true');
//     } else {
//       $(this).attr('value', 'false');
//     }
// });
// $("#store").on('change', function() {
//     if ($(this).is(':checked')) {
//       $(this).attr('value', 'true');
//     } else {
//       $(this).attr('value', 'false');
//     }
// });
// close button
$(document).on('click', '.card-close', function(){
    get_id = $(this).data('id');
    get_user = $(this).siblings().find('.user_name').val()
    get_brand = $(this).siblings().find('.brandInput').val()
    get_model = $(this).siblings().find('.modelInput').val()

    Swal.fire({
        title: 'Enter a message',
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off'
        },
        inputValue: `Your request for ${get_brand}-${get_model} already updated the request, Please check once again!`,
        showCancelButton: true,
        confirmButtonText: 'Close Request',
        showLoaderOnConfirm: true,
        preConfirm: (message) => {
          newmessage = []
          newmessage.push({'message': message,'user':get_user ,'brand':get_brand, 'model':get_model })

          return fetch(`/closerequest/${get_id}`,{
              method: 'POST',
              body: JSON.stringify(newmessage)
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(response.statusText)
              }
              $(this).closest('.card').parent().fadeOut();
              return response.json()
            })
            .catch(error => {
              Swal.showValidationMessage(
                `Request failed: ${error}`
              )
            })
        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire(
                'Successfully canceled the request',
                '',
                'success'
            )
        }
    })


    // fetch(`closerequest/${get_id}`).then(res.json()).then(data=>{
    //     if(data.success == 'true'){

    //     }
    // })
})
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

let getUser = async (id)=>{
    let res = await fetch(`/user/users/${id}`)
    if(res.ok){
        let user = await res.json()
        $('#nameInput').val(user.name)
        $('#emailInput').val(user.email)
        $('#phoneInput').val(user.phone)
        $('#nameInput').data('id', user.id)
        $('#passwordInput').data('id', user.id)
    }
}
$('#editUser').on('click', async function(){
    let name = $('#nameInput').val()
    let email = $('#emailInput').val()
    let phone = $('#phoneInput').val()

    let userId = $('#nameInput').data('id')
    
    let user_data = []
    
    user_data.push({
        'id': userId,
        'name': name,
        'email': email,
        'phone': phone,
    })
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 
    let res = await fetch(`/user/users/${userId}/`, {method:'PUT', headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken }, body: JSON.stringify(user_data)})
    if(res.ok){
        let data = await res.json()
        $('#edituserModal').modal('toggle')
        $('#username').html(name)
        $('#phone').html(phone)
        Swal.fire({
            icon: 'success',
            title: 'Saved',
            text: 'Changes Saved Successfully!'
        })
    } else{
        Swal.fire({
            icon: 'error',
            title: 'Oops..',
            text: 'Something went wrong!'
        })
    }
})

let changePass = async ()=>{
    let id = $('#passwordInput').data('id');
    let pass = $('#passwordInput').val()
    let confirm_pass = $('#confirmPasswordInput').val()
    if(pass == ''){
        $('#passwordInput').css('border', '1px solid red');
        return false;
    } else{
        $('#passwordInput').css('border', '1px solid #ced4da');
    }
    if(confirm_pass ==''){
        $('#confirmPasswordInput').css('border', '1px solid red');
        return false;
    }else{
        $('#confirmPasswordInput').css('border', '1px solid #ced4da')
    }
    if(pass != '' && confirm_pass !=''&& pass != confirm_pass){
        Swal.fire({
            icon: 'error',
            title: 'Oops..',
            text: 'Passwords doesn\'t match!'
        })
        return false;
    }
    let pass_data =[{
        'password': pass,
        'password2': confirm_pass
    }]
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 

    let res = await fetch(`/user/change_password/${id}/`, {method:'PUT', headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        body: JSON.stringify(pass_data)
    })
    if(res.ok){
        let data = await res.json()
        $('#changePasswordModal').modal('toggle')
        $('#passwordInput').val('')
        $('#confirmPasswordInput').val('')
        Swal.fire({
            icon: 'success',
            title: 'Saved',
            text: 'Password Saved Successfully!'
        })
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops..',
            text: 'Something went wrong!'
        })
    }
}

// Search The spares with brand product and spare
$(function(){
    var product_input = $('.search_product').val()
    var issue_input = $('.issueselect').val()
    var brand_input = $('.search_brand').val()
    $(document).on('click', '.get_spare', function(e){
        e.preventDefault();
        product_input = $('.search_product').val()
        issue_input = $('.issueselect').val()
        brand_input = $('.search_brand').val()
        if(product_input == ''){
            newdata[0]['model'] = ''
        }
        fetchSpares(brand_input, product_input, issue_input)
    })
   
})
async function fetchSpares(brand_input, product_input, issue_input){
    let res = await fetch(`/api/searchspare?brand=${brand_input}&product=${newdata[0]['model']}&spare=${issue_input}`, {
        method: 'GET'
    })
    let data = await res.json()
    $('.spare-results-container').html('');
    if(data.length > 0){
        data.map((i,e)=>{

            $('.spare-results-container').append(`
            <div class="col-lg-4 col-md-6 g-2 mt-5 each_spare">
    
                <div class="card h-100">
                    <div class="card-body">
                        <button type="button" data-id="${i.id}" class="btn-close btn-sm position-absolute end-6 top-6 del_spare" aria-label="Close"></button>
                        <div class="row">
                            <div class="col-6">
                                <input type="text" class="brandInput form-control" placeholder="Enter Brand" data-id="${i.product.brand.id}" value="${i.product.brand.name}">
                                <h5 class="w-100 brand">${i.product.brand.name}</h5>-
                                <input type="text" id="modelInput" class="modelInput sm-text-field" placeholder="Enter Product Model" data-id="${i.product.id}" value="${i.product.name}" autocomplete="off">
                                <span class="model">${i.product.name}</span> -
                                <span class="modelno">${i.product.model_no}</span>
                                <input type="text" class="modelnoInput" value="${i.product.model_no}" placeholder="Enter Model No*" style="width:50%">  
                            </div>
                            <div class="col-2">
                                ${i.type ? 
                                    `<select class="border-0 display_type" value="${i.type.type}">
                                        <option value="LED"${i.type.type == 'LED' && 'selected'}>LED</option>
                                        <option value="LCD"${i.type.type == 'LCD' && 'selected'}>LCD</option>
                                    </select>` :
                                    `<select class="border-0 display_type" value="">
                                        <option value="LED">LED</option>
                                        <option value="LCD">LCD</option>
                                    </select>`
                                }
                                    
                            </div>
                            <div class="col-4 mt-1 mx-auto w-auto">
                                <span class="badge-position badge request_issue rounded-pill bg-primary ms-auto">${i.name}</span>
                                <span class="badge-position badge rounded-pill bg-danger ms-auto">${JSON.parse(document.getElementById('user_phone').textContent)}</span>
                                <input type="hidden" class="user_name" name="" value="${JSON.parse(document.getElementById('user_phone').textContent)}">
                            </div>
                        </div>
                        <form class="mt-1 spare-details-${e}" action="">
                            
                            <button class="d-block btn btn-sm mt-3 p-0 link-primary new-btn" type="button">+ Add New</button>
                            <div class="text-center position-relative">
                                <button type="submit" class="bottom-0 mt-3 btn btn-sm btn-primary spare-submit" data-edit="true">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            `)
            let temp_count = i.spare_variety.length - 1;
            i.spare_variety.map((quality,index)=>{
                if(quality.quality){
                    $(`.spare-details-${e}`).prepend(`
                    <div class="row g-0 quality-input rows-${temp_count}">
                        <div class="col-6 g-1">
                            <input type="text" class="form-control form-control-sm quality" id="quality" placeholder="Quality" value="${quality.quality.quality}">
                        </div>
                        <div class="col-6 g-1">
                            <input type="number" class="form-control form-control-sm price" id="price" placeholder="Price" min="1" value="${quality.purchase_price}">
                        </div>
                    </div>
                `)
                }else if(quality.property){
                    $(`.spare-details-${e}`).prepend(`
                    <div class="row g-0 quality-input rows-${temp_count}">
                        <div class="col-6 g-1">
                            <input type="text" class="form-control form-control-sm quality" id="propery" placeholder="" value="${quality.property.property_value} ${quality.property.property_unit}">
                        </div>
                        <div class="col-6 g-1">
                            <input type="number" class="form-control form-control-sm price" id="price" placeholder="Price" min="1" value="${quality.purchase_price}">
                        </div>
                    </div>`)
                }
                temp_count -= 1;
            })
        })
        $('.brandInput').hide();
        $('.modelInput').hide();
        $('.modelnoInput').hide();
    } else{
        $('.spare-results-container').html(`
            <h6 class="text-center mt-3"> Sorry no results! </h6>
        `);
    }
}
$(document).on('click','.del_spare', function(){
    let spare_id = $(this).data('id');
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then(async(result) => {
        if (result.isConfirmed) {
            let res = await fetch(`/api/sparesdetail/${spare_id}/`,{
                method:'DELETE',
                headers:{'Content-type': 'application/json', "X-CSRFToken": csrftoken }
            })
            if(res.ok){
                Swal.fire(
                    'Deleted!',
                    'Your file has been deleted.',
                    'success'
                )
                $(this).parents().parents().parents('.each_spare').fadeOut();
            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Something went wrong!',
                  })
            }
          
        }
      })
})

// Delete User
$('.no-modal').click(function(e) {
    console.log("work")
    e.stopPropagation();
});
function deleteUser(){
    let user_id = $('#nameInput').data('id');
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
            let res = await fetch(`/user/users/${user_id}/`, {
                method: 'DELETE',
                headers:{'Content-type': 'application/json', "X-CSRFToken": csrftoken }
            })
            if(res.ok){
                $('#edituserModal').modal('toggle');
                $(`[data-id='${user_id}']`).fadeOut();
                Swal.fire(
                    'Deleted!',
                    'Your file has been deleted.',
                    'success'
                )

            }else if (!res.ok){
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Something went wrong!',
                })
                const message = `An error has occured: ${res.status}`;
                throw new Error(message);
                
            }

        }
      })
}
// $('#edituserModal').on('show.bs.modal', function (e) {
//     var button = e.relatedTarget;
//     console.log($(e.target))
//     if($(button).hasClass('no-modal')) {
//       e.stopPropagation();
//     }  
// });
//----------------------------------------------Booking start--------------------------------------------//
// Fetch name on entering mobile
const mobileNo = document.querySelector('#bookingno');
if(mobileNo){
    mobileNo.addEventListener('input', function(){
      if(this.value.length == 10){
        let data = new FormData()
        data.append('mobile', this.value)
        if(this.value.length == 10){
          fetch('/repairuser/', {
            method: 'POST',
            body: data
          }).then(res => res.json()).then(data=>{
            if(data.user != null){
              document.querySelector('#bookingname').value = data.user.fields.name;
            }else{
              document.querySelector('#bookingname').value = '';
            }
          }).catch(err=>console.log(err));
        }
      }
    })
}
// GO back for the booking pop up
function goback(tohide, toshow){
    $(`.${tohide}`).addClass('d-none');
    $(`.${toshow}`).removeClass('d-none')
    if(!$('.issue-list').hasClass('d-none')){
        $('.enq-btn').show();
    }
}
function clearFields(...id){
    id.map( (i,e)=>{
        $(`#${i}`).val('')
    })
}
let total_amount = 0;
// Fetch price for booking
function fetchprice() {
    let brandInput = $('#brandInput').val()
    let productInput = $('#productInput').val().split("|")
    let issue = $('#issue_select').val()
    const current_year = new Date().getFullYear()

    $('.issue-list').removeClass('d-none');
    $('.customer-questions').addClass('d-none');

    $('.issue-list').html(`<img src="../../../static/serviceAdmin/img/loader.svg" height="150" width="150" alt="">`)
    $('#product_name').html(`${brandInput}- ${productInput[0]} | ${productInput[1]}`)
    $('.issue-list').html('')
    // // creating tbody
    // let tbody = document.createElement('tbody');
    // tbody.className = 'issue-list';
    // document.querySelector('.table-invoice').appendChild(tbody);

    issue.map(each=>{
        if(each.toLowerCase() != 'others'){
            fetch(`/api/getprice/${productInput[0]}/${each}/?model=${productInput[1]}`, {
                method: 'GET',
            }).then(res=>res.json()).then(data=>{
                if(data.length){
                    if(each.toLowerCase() == 'display'){
                        $('.issue-list').append(`
                            <div class="col-md-6">
                                <h5> Display Varieties </h5>
                                <table class="table table-invoice">
                                    <thead>
                                        <tr>
                                            <th class="text-center" width="2%"></th>
                                            <th>Spare Details</th>
                                            <th class="text-right" width="20%">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody class="display-variety">
                                    </tbody>
                                </table>
                            </div>
    
                        `)
                        data[0].spare_variety.map((spare,index)=>{
                            $('.display-variety').append(`
                                <tr class="spare-list">
                                    <td>
                                        <input type="radio" class="spare-variety selected-spare" id="${spare.id}" name="display_variety" value="${spare.purchase_price}">
                                    </td>
                                    <td>
                                        <label class="" for="${spare.id}" style="width:100%; display:block;>
                                        <td class="text-center">${spare.quality.quality}</td>
                                    </td>
                                    
                                    <td class="text-right">₹ ${spare.purchase_price}</td>
                                </tr>
                                    
                            `)
                        })
                    } 
                    if(each.toLowerCase() == 'battery'){
                        $('.issue-list').append(`
                            <div class="col-md-6">
                                <h5> Battery variety </h5>
                                <table class="table table-invoice">
                                    <thead>
                                        <tr>
                                            <th class="text-center" width="2%"></th>
                                            <th>Spare Details</th>
                                            <th class="text-right" width="20%">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody class="battery-variety">
                                    </tbody>
                                </table>
                            </div>
    
                        `)
                        data[0].spare_variety.map((spare,index)=>{
                            $('.battery-variety').append(`
                                
                                <tr class="spare-list">
                                    <td>
                                        <input type="checkbox" class="spare-variety selected-spare battery-mah" id="${spare.id}" name="battery_variety" value="${spare.property.property_value * 0.25}">
                                    </td>
                                    <td>
                                        <label class="" for="${spare.id}" style="width:100%; display:block;>
                                        <td class="text-center">${spare.property.property_value}MAH</td>
                                    </td>
                                    
                                    <td class="">₹ ${spare.property.property_value * 0.25}</td>
                                </tr>
                                <tr>
                                    <td><input class="form-check-input spare-variety spare-extra" value="200" type="checkbox" id="batteryServiceCharge"></td>
                                    <td>
                                        <p>
                                            <label class="form-check-label" for="batteryServiceCharge">
                                                Service charge for (Non Removable Battery)
                                            </label>
                                        </p>
                                    </td>
                                    <td class="">
                                        ₹ 200
                                    </td>
                                </tr>
                            `)
                           })
                    }
                    if(each.toLowerCase() == 'charger port'){
                        $('.issue-list').append(`
                            <div class="col-md-6">
                                <h5> Charger Port </h5>
                                <table class="table table-invoice">
                                    <thead>
                                        <tr>
                                            <th class="text-center" width="2%"></th>
                                            <th>Spare Details</th>
                                            <th class="text-right" width="20%">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody class="charger-port">
                                    </tbody>
                                </table>
                            </div>
    
                        `)
                        $('.charger-port').append(`
                                
                            <tr class="spare-list">
                                <td>
                                    <input type="checkbox" class="spare-variety charger_variety selected-spare" id="${data[0].spare_variety[0].id}" name="charger_variety" value="${calculateChargerPrice(data[0].product.release_year, data[0].spare_variety[0].variety_name)}">
                                </td>
                                <td>
                                    <label class="" for="${data[0].spare_variety[0].id}" style="width:100%; display:block;>
                                    <td class="text-center">${(current_year - data[0].product.release_year)>3 ? 'OLD': 'New'} - ${data[0].spare_variety[0].variety_name}</td>
                                </td>
                                
                                <td class="text-right">${calculateChargerPrice(data[0].product.release_year, data[0].spare_variety[0].variety_name)}</td>
                            </tr>
                            <tr>
                                <td><input class="form-check-input spare-variety spare-extra" value=${calculateCCBoard(data[0].product.release_year, data[0].spare_variety[0].variety_name)} type="checkbox" id="ccboardOption"></td>
                                <td>
                                    <p>
                                        <label class="form-check-label" for="ccboardOption">
                                            Include ccboard
                                        </label>
                                    </p>
                                </td>
                                <td class="">
                                    ${calculateCCBoard(data[0].product.release_year, data[0].spare_variety[0].variety_name)}
                                </td>
                            </tr>
                        `)
                    }
                }else{
                    let product = $('#productInput').val()
                    $('.issue-list').append(`
                    <tr class="text-center">
                        <td colspan="3">
                            <p class="text-center"> Sorry price not available </p>
                                <button class="request-btn btn btn-sm btn-danger rounded-pill" onclick="saveSpareRequest('${brandInput}', '${product}' ,'${issue}')" type="button">Submit Request</button>
                        <td
                    </tr>  
                    `)
                }
               
            }).catch(err=>console.log(err));
        }else if(each.toLowerCase() == 'others'){
            $('.issue-list').append(`
                <div class="col-md-6">
                    <h5> Other </h5>
                    <div class="row">
                        <div class="col-12 mb-2">
                            <input type="text" id="other_issue_name" class="form-control other_issue_name" placeholder="Enter Issue Name*">
                        </div>
                        <div class="col-12 mb-0">
                            <input type="number" min="0" class="form-control spare-variety other_value" placeholder="Enter Amount*">
                        </div>
                    </div>
                </div>
            `)
        }
    })
}
// Get other issue
const others_list = []
// Get all Brands
fetch(`/api/other_issue/?product="${$('#productInput').val()}"&other_issue="${$('#other_issue_name').val()}"`).then(res=>res.json()).then(data=>{
    data.map((i,e)=>{
        // s.push({'value': `${i.name}|${i.model_no}`, 'product':`${i.name}` , 'model': `${i.model_no}`})
        others_list.push({'other_issue': `${i.other_issue}`, 'other_issue_value': `${other_issue_value}`})
    })
})

const OtherIssueAutoComplete = new autoComplete({
    selector: "#other_issue_name",
    data: {
        src: others_list,
        keys: ["other_issue"],

        cache: true,
    },
    searchEngine: "loose",
    resultsList: {
        class: "text-capitalize",
        element: (list, data) => {
            if (!data.results.length) {
                // Create "No Results" message element
                const message = document.createElement("div");
                // Add class to the created element
                message.setAttribute("class", "no_result");
                // Add message text content
                message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                // Append message element to the results list
                list.prepend(message);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                OtherIssueAutoComplete.input.value = selection.value;
            }
        }
    }
})
$(document).on('change', '#batteryServiceCharge', function(){
    if(!$('.battery-mah')[0].checked){
        $('.battery-mah').click()
    }
})
$(document).on('change','.battery-mah', function(){
    if(!$(this).checked && $('#batteryServiceCharge')[0].checked){
        $('#batteryServiceCharge').click()
    }
})

$(document).on('change', '#ccboardOption', function(){
    if(!$('.charger_variety')[0].checked){
        $('.charger_variety').click()
    }
})

$(document).on('change','.charger_variety', function(){
    if(!$(this).checked && $('#ccboardOption')[0].checked){
        $('#ccboardOption').click()
    }
})

let total;
$(document).on('change', '.spare-variety', function(){
    total = 0
    
    let other_val = $('.other_value').val()

    if(other_val === '' ||  other_val  === undefined)  (other_val = 0)

    total += parseFloat(other_val)

    $.each($('.spare-variety:checked') ,function(i, e) {
        total += parseFloat($(e).val())
    });
    $('.gross-amount').html(`The Net Total is 
    <span class="display-amount">₹<span class="total_amount">${parseFloat(total)}</span></span>`)
    total_amount = total;
})

// Resetting all the amount on modal close
$(document).on('hidden.bs.modal','#booking_confirm_modal', function(){
    ResetBookingModal()
})
function ResetBookingModal(){
    $('.issue-list').removeClass('d-none');
    $('.customer-questions').addClass('d-none');
    $('.gross-amount').text('');
    $('.balance_payment').hide();
    $('#advance_payment').val(0)
}

// subtracting total amount
let balance_payment;
$(document).on('keyup', '#advance_payment', function(){
    balance_payment = 0;
    let advance_payment = parseFloat($(this).val())
    balance_payment = total - advance_payment
    if(balance_payment){
        if(advance_payment > total){
            Swal.fire({
                icon: 'warning',
                title: 'Oops...',
                text: 'Please enter valid amount!',
            })
            $(this).val('')
            balance_payment = 0;
            $('.balance_payment').hide()
        }else{
            $('.balance_payment').show()
            $('.balance_amount').text(`${balance_payment}`)
        }
    }else{
        $('.balance_payment').hide()
    }

})

// save bookings
let saveCustomer = async function(customer_type) {

    if($('.issue-list').hasClass('d-none') || customer_type=='ENQ'){

        const booking_no = $('#bookingno').val()
        const bookingname = $('#bookingname').val()
        const brandInput = $('#brandInput').val()
        const productInput = $('#productInput').val().split("|")
        const issue = $('#issue_select').val()
        const selected_spare = $('.selected-spare:checked');
        const spare_extra = $('.spare-extra:checked');
        const alternate_mobile = $('#alternatebookingno').val();
        const mobile_pin = $('#mobile_pin').val();
        const advance_payment = $('#advance_payment').val()
        const battery_service = $('#batteryServiceCharge').is(':checked');
        const cc_board = $('#ccboardOption').is(':checked');
        const csrftoken = getCookie('csrftoken'); // HERE: get the token 
        enq_data = {
            'mobile': booking_no,
            'name': bookingname,
            'alternate_mobile': alternate_mobile,
            'enq_or_cus': customer_type,
        }
        
        if(customer_type == 'CUS'){
            if(!selected_spare && $('.issue-list').find('tr').hasClass('spare-list') != false){
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Please select a spare!',
                })
                return false;
            }
        }
        let res = await fetch('/api/bookings/', {
            method: 'POST',
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
            body: JSON.stringify(enq_data)
        })
        if(res.ok){
            let data = await res.json()
                // send the Booking details

                if(customer_type=='CUS'){
                    if(!productInput[1]){
                        send_data = {
                            'booking_for': data.pk,
                            'brand': brandInput,
                            'products':  $('#productInput').val(),
                            'mobile_pin': mobile_pin,
                            'other_issue': $('.other_issue_name').val(),
                            'other_issue_val': $('.other_value').val(),
                            'total_payment': total_amount,
                            'advance_payment': advance_payment,
                            'is_charger_cc_board':cc_board,
                            'service_charge': battery_service,
                            'issue': issue,
                            'selected_spare': [],
                            'extras': [],
                        }
                        
                    }else{
                        send_data = {
                            'booking_for': data.pk,
                            'total_payment': total_amount,
                            'advance_payment': advance_payment,
                            'brand': brandInput,
                            'products': productInput[1],
                            'other_issue': $('.other_issue_name').val(),
                            'other_issue_val': $('.other_value').val(),
                            'issue': issue,
                            'mobile_pin': mobile_pin,
                            'is_charger_cc_board':cc_board,
                            'service_charge': battery_service,
                            'selected_spare': [],
                            'extras': [],
                        }
                    }
                    // getting selected spares
                    selected_spare.map((i, e)=>{
                        send_data['selected_spare'].push($(e).attr('id'))
                    } )
                    // getting if ccboard selected or battery service charge 
                    spare_extra.map((i, e)=>{
                        send_data['extras'].push($(e).attr('id'))
                    } )
    
                    let detail_res = await fetch('/api/bookingdetails/', {
                        method: 'POST',
                        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
                        body: JSON.stringify(send_data)
                    })
                    if (detail_res.ok){
                        let detail_data = detail_res.json()
    
                        // Saving Customer response
                        let customer_res_data = {
                            'booking': data.pk,
                            'questions': [],
                        }
                        // getting customer question responses
                        let questions = $('.question-list .customer-response');
                        questions.map((i, e)=>{
                            let each_quest = {}
                            each_quest[$(e).data('question')] = ($(e).val())
                            customer_res_data['questions'].push(each_quest)
                        })
                        
                        let customer_res = await fetch('/api/customerresponses/', {
                            method: 'POST',
                            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
                            body: JSON.stringify(customer_res_data)
                        })
                        if(customer_res.ok){
                            clearFields('bookingno','bookingname','brandInput','alternatebookingno','mobile_pin','productInput','issuetext')
                            $('#booking_confirm_modal').modal('toggle')
                            Swal.fire({
                                position: 'bottom-end',
                                icon: 'success',
                                title: 'New Booking has been saved',
                                showConfirmButton: false,
                                timer: 1500
                            })

                            location.reload();
                        }
                    } 
                    clearFields('bookingno','bookingname','brandInput','alternatebookingno','mobile_pin','productInput','issuetext')
                    $('#booking_confirm_modal').modal('toggle')
                    Swal.fire({
                        position: 'bottom-end',
                        icon: 'success',
                        title: 'New Booking has been saved',
                        showConfirmButton: false,
                        timer: 1500
                    })
                    location.reload();
                    $('.all_bookings').prepend(`
                        <div class="col-lg-6">
                            <div class="card booking_card" data-booking="${data.pk}" data-bs-toggle="modal" data-bs-target="#bookingdetailModal" data-bs-focus="false">
                                <div class="card-body">
                                    <h6 class="booking_name">${data.name}</h6>
                                    <div class="row">
                                        <div class="col-8">
                                            <div class="contact">
                                                <i class="bx bx-phone"></i> ${data.mobile}
                                            </div>
                                            <span class="badge rounded-pill bg-danger">${data.enq_or_cus}</span>
                                        </div>
                                        <div class="col-4">
                                            <div class="contact">
                                                Issue:
                                                <span class="badge bg-success">${data.issue}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `)
                }else if(customer_type=='ENQ'){
                    $('#booking_confirm_modal').modal('toggle')
                    send_data = {
                        'booking_for': data.pk,
                        'brand': brandInput,
                        'products':  $('#productInput').val(),
                        'mobile_pin': mobile_pin,
                        'issue': issue,
                        'selected_spare': [],
                    }
                    
                    // getting selected spares
                    selected_spare.map((i, e)=>{
                        send_data['selected_spare'].push($(e).attr('id'))
                    } )

                    let detail_res = await fetch('/api/bookingdetails/', {
                        method: 'POST',
                        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
                        body: JSON.stringify(send_data)
                    })
                    if(detail_res.ok){
                        Swal.fire({
                            position: 'bottom-end',
                            icon: 'success',
                            title: 'New Booking has been saved',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        
                        location.reload();
                    }
                }
            
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong!',
            })
        }
    }else if(customer_type == 'CUS'){
        $('.enq-btn').hide();
        $('.issue-list').addClass('d-none');
        $('.customer-questions').removeClass('d-none')
        let res = await fetch(`/api/firststagebookingquestions/`, {
            method: 'GET',
        })
        $('.question-list').html('')
        let data = await res.json()
        data.map((element, i)=>{
            $('.question-list').append(`
                <div class="question">
                    <label class="form-label" for="${i}"> ${element.question} </label>
                    <div class="response mb-2">
                        <select class="form-control customer-response" data-question="${element.question}" type="text" id="${i}">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
            `)
        })
        $('.question-list').append(`
            <div class="question">
                <label class="form-label" for="advance_payment">Advance payment</label>
                <div class="response mb-2">
                    <input type="number" min="0" class="form-control" id="advance_payment" value="0">
                </div>
            </div>
        `)
    }
   
}
let summary;
async function calculateTotalBalance(data){
    if(parseFloat(data.total_payment) !== 0 ){
        // let bal_payment = parseFloat(data.total_payment) - parseFloat(data.advance_payment)

        $('.edit-balance-amount').text(`₹${parseFloat(await summary.balancePayment()).toFixed(2) }`)
        $('.edit-advance-amount').text(`₹${data.advance_payment}`)
        $('.edit-total-amount').text(`₹${await summary.calculateChangeTotalAmount()}`)
    }else{
        $('.edit-balance-amount').text(`No balance Payment`)
        $('.edit-advance-amount').text(`No Advance paid`)
        $('.edit-total-amount').text(`No Total Amount`)
    }

}
// Retriving booking details
$(document).on('click', '.booking_card', async function(){
    saved_booking_id = $(this).data('booking')
    let res = await fetch(`/api/bookingdetail/${saved_booking_id}`,{
        method: 'GET',
    })
    if(res.ok){
        let data = await res.json()
        
        let selected_multiselect_options = ({
            placeholder:'Please select issue*',
        });
        const display_spare= data['selected_spare'].filter((e,i)=>{
            return e['spare_name']['name'] === 'Display'
        })
        
        summary = new OrderSummary(data, data.total_payment, data.advance_payment, data.issue, data.products, data.brands,display_spare.length ? display_spare[0].purchase_price : 0, data.other_issue)

        $('#bookedmobno').val(data.booking_for.mobile )
        $('#bookedalternatebookingno').val(data.booking_for.alternate_mobile)
        $('#bookedname').val(data.booking_for.name)

        $('#booked_mobile_pin').val(data.mobile_pin)
        $('#bookedname').data('id', saved_booking_id)
       
        $('#bookedbrand').val(`${data.brands}`)

        $('#bookedProduct').val(`${data.products}`)
        $('.delete-booking-button').attr('data-id', saved_booking_id)
        $('.update-booking-button').attr('data-id', saved_booking_id)
        // removing all selected attributes
        $('.selectedissuetext option').each((i,e)=>{
            $(e).removeAttr('selected')
        })
        let $selected_multiselect = $('#selectedissuetext')
        $selected_multiselect.bsMultiSelect()

        $('.selectedissuetext option').each((i,e)=>{
            data.issue.map((eachItem,index)=>{
                if($(e).val().toLowerCase() == eachItem.issue_name.toLowerCase()){
                    $(e).attr('selected','')
                }
            })
            $selected_multiselect.data('DashboardCode.BsMultiSelect').updateOptionSelected(i);
            // selected_multiselect.updateOptionSelected()
        })
        // $('#selectedissuetext').val(data.issue)
        // $('#selectedissuetext option:selected')
        $('.booking-btn').data('id', `${data.pk}`)
        
        data.issue.map(async(e,i)=>{
            if(e.issue_name == 'Display'){
                const product_model_input = $('#bookedProduct').val().split('|')
                const dis_res = await sparedatachange('Display',product_model_input[0], product_model_input[1], data)
            }
        })
        if(parseFloat(data.total_payment) !== 0 ){
            // let bal_payment = parseFloat(data.total_payment) - parseFloat(data.advance_payment)
            const total_payment = await summary.calculateTotalAmount()

            $('.edit-balance-amount').text(`₹${parseFloat(await summary.balancePayment()).toFixed(2)}`)
            $('.edit-advance-amount').text(`₹${data.advance_payment}`)
            $('.edit-total-amount').text(`₹${total_payment}`)
        }else if(parseFloat(data.advance_payment) !== 0 && !total_payment){
            $('.edit-balance-amount').text(`Unknown balance payment`)
            $('.edit-advance-amount').text(`₹${data.advance_payment}`)
            $('.edit-total-amount').text(`No Total Amount`)
        }
        else{
            $('.edit-balance-amount').text(`No balance Payment`)
            $('.edit-advance-amount').text(`No Advance paid`)
            $('.edit-total-amount').text(`No Total Amount`)
        }
    }
    let responses = await fetchCustomerResponses(saved_booking_id);
    if(responses.error){
        $('.customer-responses').html(`<p style="color:red;">Questions cannot be loaded, Something went wrong! </p>
        <button class="btn btn-sm btn-primary rounded-pill" onclick="fetchCustomerResponses(${saved_booking_id})">Try again</button>`)
    } else{
        $('.customer-responses').html('');
        responses.map((element, i)=>{
            $('.customer-responses').append(`
                <div class="question">
                    <label class="form-label" for="${i}"> ${element.question} </label>
                    <div class="response mb-2">
                        <select class="form-control customer-response" data-question="${element.question}" type="text" id="${i}" disabled>
                            <option value="Yes" ${element.response == 'Yes' && 'selected'}>Yes</option>
                            <option value="No" ${element.response == 'No' && 'selected'}>No</option>
                        </select>
                    </div>
                </div>
            `);
        })
    }
});
async function fetchCustomerResponses(id){
    let res = await fetch(`/api/eachcustomerresponses/${id}` , {
        method: 'GET',
    })
    if(res.ok){
        let data = await res.json();
        return data;
    }else{
        return {"error": "something went wrong"}
    }
}
// fetch selected booking
async function fetchSelectedBooking(id){
    let res = await fetch(`/api/bookingdetail/${saved_booking_id}`,{
        method: 'GET',
    })
    if(res.ok){
        return await res.json()
    }
}
// ---
function displayOtherIssue(issue, value, id){
    $('.new-issues').append(`
        <span class="chip">
            <span class="other-issue-name">${issue.val()} - ₹${value.val()}</span>
            <button type="button" class="btn-close p-0 float-end chip-close-btn remove_other_issue" data-id="${id}" aria-label="Close"></button>
        </span>
    `)
}
// Change in other issue
function ChangeOtherIssue(){
    $('.new-issues').text('')
    $('.selected_spares').text('')
    summary.calculateTotalAmount()
    summary.other_issue.map((e,i)=>{
        $('.new-issues').append(`
            <span class="chip">
                <span class="other-issue-name">${e.other_issue} - ₹${e.other_issue_value}</span>
                <button type="button" class="btn-close p-0 float-end chip-close-btn remove_other_issue" data-id="${e.id}" aria-label="Close"></button>
            </span>
        `)
    })
    $('.selectedissuetext').val().map((e,i)=>{
        $('.selected_spares').append(`${e}, `)
    })
}
$(document).on('click', '.remove_other_issue', async function(){
    const issue_id = $(this).attr('data-id')
    $(this).parents('.chip').hide()
    summary.removeOtherIssue(issue_id)
    let data = await fetchSelectedBooking(saved_booking_id)
    calculateTotalBalance(data)
    // ChangeOtherIssue()
})

$(document).on('click','.add_issue', function(){
    loadIssues('.edit-issue-list')
    ChangeOtherIssue()
})
async function loadIssues(id){
    let container = $(id);
    const current_year = new Date().getFullYear()
    container.text('');
    const dis_res = await summary.getSpare(summary.product, 'Display')
    const bat_res = await summary.getSpare(summary.product, 'Battery')
    const charger_res = await summary.getSpare(summary.product, 'Charger Port')
    const booking = await fetchSelectedBooking()

        // Display Variety
        container.append(`
            <div class="col-md-6">
                <h6> Display Varieties </h6>
                <table class="table table-invoice">
                    <thead>
                        <tr>
                            <th class="text-center" width="2%"></th>
                            <th>Spare Details</th>
                            <th class="text-right" width="20%">Price</th>
                        </tr>
                    </thead>
                    <tbody class="edit-display-variety">
                    </tbody>
                </table>
            </div>

        `)
        dis_res[0].spare_variety.map((spare,index)=>{
            $('.edit-display-variety').append(`
                <tr class="spare-list" data-amount="${spare.purchase_price}">
                    <td>
                        <input type="radio" class="spare-variety change-spare selected-spare edit-selected-spare" id="${spare.id}" name="display_variety" value="${spare.purchase_price}">
                    </td>
                    <td>
                        <label class="" for="${spare.id}" style="width:100%; display:block;>
                        <td class="text-center">${spare.quality.quality}</td>
                    </td>
                    
                    <td class="text-right">₹ ${spare.purchase_price}</td>
                </tr>
                    
            `)
        })
        if($('#selectedissuetext').val().includes('Display') && summary.selected_display != 0){
            $('.spare-list').map((i,e)=>{
                if(parseInt($(e).attr('data-amount')) === parseInt(summary.selected_display)){
                    $(e).find('input').attr('checked', true)
                }
            })
        }
    //--------Other Issue----------------//
    container.append(`
        <div class="col-md-6">
            <div class="row">
                <h6> Add Issues </h6>
                <div class="col-md-12 mb-2">
                    <input type="text" class="form-control new-other-issue" data-add-issue="issue" name="issues" id="issues" placeholder="Issue*">
                </div>
                <div class="col-md-12 mb-2">
                    <input type="number" class="form-control new-other-value" name="issue-value" id="issue-value" min="0" placeholder="Issue Rate*">
                    <button class="btn btn-warning mt-2 update-issue-btn" disabled>Update</button>
                </div>
            </div>
        </div>
    `)
    //--------- Battery Issue -------------//
    container.append(`
        <div class="col-md-6">
            <h5> Battery variety </h5>
            <table class="table table-invoice">
                <thead>
                    <tr>
                        <th class="text-center" width="2%"></th>
                        <th>Spare Details</th>
                        <th class="text-right" width="20%">Price</th>
                    </tr>
                </thead>
                <tbody class="battery-variety">
                </tbody>
            </table>
        </div>
    `)
    bat_res[0].spare_variety.map((spare,index)=>{
        $('.battery-variety').append(`
            
            <tr class="spare-list">
                <td>
                    <input type="checkbox" class="spare-variety change-spare selected-spare battery-mah edit-selected-spare" id="${spare.id}" name="battery_variety" value="${spare.property.property_value * 0.25}">
                </td>
                <td>
                    <label class="" for="${spare.id}" style="width:100%; display:block;>
                    <td class="text-center">${spare.property.property_value}MAH</td>
                </td>
                
                <td class="">₹ ${spare.property.property_value * 0.25}</td>
            </tr>
            <tr>
                <td><input class="form-check-input spare-variety spare-extra edit-selected-spare" value="200" type="checkbox" id="batteryServiceCharge"></td>
                <td>
                    <p>
                        <label class="form-check-label" for="batteryServiceCharge">
                            Service charge for (Non Removable Battery)
                        </label>
                    </p>
                </td>
                <td class="">
                    ₹ 200
                </td>
            </tr>
        `)
    })
    const contains_battery_spare = summary.data['selected_spare'].filter((e, i)=>{
        return e['spare_name']['name'] === 'Battery'
    })
    if(contains_battery_spare.length){
        $('.battery-mah').attr('checked', true)
        if(booking['service_charge']){
            $('#batteryServiceCharge').attr('checked', true);
        }
    }

    //----------- charger port -------------//
    container.append(`
        <div class="col-md-6">
            <h5> Charger Port </h5>
            <table class="table table-invoice">
                <thead>
                    <tr>
                        <th class="text-center" width="2%"></th>
                        <th>Spare Details</th>
                        <th class="text-right" width="20%">Price</th>
                    </tr>
                </thead>
                <tbody class="charger-port">
                </tbody>
            </table>
        </div>

    `)
    $('.charger-port').append(`
            
        <tr class="spare-list">
            <td>
                <input type="checkbox" class="spare-variety change-spare charger_variety selected-spare edit-selected-spare" id="${charger_res[0].spare_variety[0].id}" name="charger_variety" value="${calculateChargerPrice(charger_res[0].product.release_year, charger_res[0].spare_variety[0].variety_name)}">
            </td>
            <td>
                <label class="" for="${charger_res[0].spare_variety[0].id}" style="width:100%; display:block;>
                <td class="text-center">${(current_year - charger_res[0].product.release_year)>3 ? 'OLD': 'New'} - ${charger_res[0].spare_variety[0].variety_name}</td>
            </td>
            
            <td class="text-right">${calculateChargerPrice(charger_res[0].product.release_year, charger_res[0].spare_variety[0].variety_name)}</td>
        </tr>
        <tr>
            <td><input class="form-check-input spare-variety spare-extra edit-selected-spare" value=${calculateCCBoard(charger_res[0].product.release_year, charger_res[0].spare_variety[0].variety_name)} type="checkbox" id="ccboardOption"></td>
            <td>
                <p>
                    <label class="form-check-label" for="ccboardOption">
                        Include ccboard
                    </label>
                </p>
            </td>
            <td class="">
                ${calculateCCBoard(charger_res[0].product.release_year, charger_res[0].spare_variety[0].variety_name)}
            </td>
        </tr>
    `)
    
    const contains_charger_spare = summary.data['selected_spare'].filter((e, i)=>{
        return e['spare_name']['name'].toLowerCase() === 'charger port'
    })

    if(contains_charger_spare.length && $('#selectedissuetext').val().includes('Charger Port')){
        $('.charger_variety').attr('checked', true)
    }
    
    if(booking['is_charger_cc_board']){
        $('#ccboardOption').attr('checked', true);
    }
}

$(document).on('click','.update-issue-btn', async function(){
    const new_issue = $('.new-other-issue')
    const new_issue_value = $('.new-other-value')
    const id = Math.floor(Math.random() * 100000)
    summary.addOtherIssue(new_issue.val(),new_issue_value.val(),id)
    displayOtherIssue(new_issue,new_issue_value, id)

    let data = await fetchSelectedBooking(saved_booking_id)
    calculateTotalBalance(data)
    new_issue.val('')
    new_issue_value.val('')
    $(this).attr('disabled', true)
})
// $(document).on('change', '#display_spare_edit', async function(){
//     let data = await fetchSelectedBooking(saved_booking_id)
//     calculateTotalBalance(data)
    
// })
$(document).on('click', '.edit-selected-spare', async function(){
    let data = await fetchSelectedBooking(saved_booking_id)
    if(parseFloat(data.total_payment) !== 0 ){
        // let bal_payment = parseFloat(data.total_payment) - parseFloat(data.advance_payment)

        $('.edit-total-amount').text(`₹${parseFloat(await summary.calculateChangeTotalAmount())}`)
        $('.edit-balance-amount').text(`₹${parseFloat(await summary.balancePayment()).toFixed(2) }`)
        $('.edit-advance-amount').text(`₹${data.advance_payment}`)
    }else{
        $('.edit-balance-amount').text(`No balance Payment`)
        $('.edit-advance-amount').text(`No Advance paid`)
        $('.edit-total-amount').text(`No Total Amount`)
    }
});

$(document).on('keyup','.new-other-value', function(){
    if($(this).val().length){
        $('.update-issue-btn').removeAttr('disabled')
    }else{
        $('.update-issue-btn').attr('disabled', true)
    }
})
// ---
$(document).on('change', '#bookedProduct', function(){
    const product_value = $(this).val();
    const issue_list = $('#selectedissuetext').val()
    console.log(product_value)
    console.log(issue_list)
})
// Updating the bookings
$(document).on('click', '.update-booking-button', async function(e){
    e.preventDefault();
    const booked_mob_no = $('#bookedmobno').val()
    const booking_alter_no = $('#bookedalternatebookingno').val()
    const booked_name = $('#bookedname').val()
    const booked_mob_pin = $('#booked_mobile_pin').val()
    const booked_product = $('#bookedProduct').val()
    const is_verified = $('#verified_checkbox').is(":checked")
    const brand = $('#bookedbrand').val()
    const selectedissuetext = $('#selectedissuetext').val()
    // const display_selected_spare = $('#display_spare_edit').val()
    const edit_selected_spare = $('.change-spare:checked');
    let model_no = booked_product.split('|')[1]
    const total_payment = await summary.calculateChangeTotalAmount()
    const other_issue = summary.other_issue
    const battery_service = $('#batteryServiceCharge').is(':checked');
    const cc_board = $('#ccboardOption').is(':checked');
    
    if(model_no == undefined){
        model_no = booked_product
    }
    let booking_detail_data;
    
    let booking_for_data = {
        "mobile": booked_mob_no,
        "alternate_mobile": booking_alter_no,
        "name": booked_name,
        "is_verified":is_verified,
    }
        
    
    booking_detail_data = {
        "model_no": model_no,
        "brand": brand,
        "issue":selectedissuetext,
        "mobile_pin":booked_mob_pin,
        // "selected_spare": [parseInt(display_selected_spare)],
        'selected_spare': [],
        "other_issue": other_issue,
        "total_payment": total_payment,
        "product": booked_product,
        'is_charger_cc_board':cc_board,
        'service_charge': battery_service,
    }
    // getting selected spares
    edit_selected_spare.map((i, e)=>{
        booking_detail_data['selected_spare'].push($(e).attr('id'))
    } )
    const csrftoken = getCookie('csrftoken'); // HERE: get the token
    let res = await fetch(`/api/bookingstatus/updates/${$(this).attr('data-id')}/`, {
        method: 'PUT',
        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        body: JSON.stringify(booking_for_data)
    })
    if(res.ok){
        let booking_detail_res = await fetch(`/api/updatebooking/${$(this).attr('data-id')}/`, {
            method: 'PUT',
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
            body: JSON.stringify(booking_detail_data)
        })
        if(booking_detail_res.ok){
            Swal.fire({
                icon: 'success',
                title: 'Saved',
                text: 'Changes Saved Successfully!'
            })
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops',
                text: 'Something went wrong!'
            })
        }
    }

    // e.preventDefault()
    // let mobile_no = $('#bookedmobno').val()
    // let alter_no = $('#bookedalternatebookingno').val()
    // let booking_name = $('#bookedname').val()
    // let booked_brand =  $('#bookedbrand').val()
    // let booked_product = $('#bookedProduct').val()
    // let issue =  $('#selectedissuetext').val()
    // let booking_id = $('#bookedname').data('id')
    
    // const csrftoken = getCookie('csrftoken'); // HERE: get the token
    // let product_split = $('#bookedProduct').val().split('|')
    // if(product_split[1]){
    //     senddata = {
    //         'name': booking_name,
    //         'mobile': mobile_no,
    //         'alternate_mobile':alter_no,
    //         'brands': booked_brand,
    //         'products': product_split[0],
    //         'issue': issue
    //     }
    // } else{
    //     senddata = {
    //         'name': booking_name,
    //         'mobile': mobile_no,
    //         'alternate_mobile':alter_no,
    //         'brands': booked_brand,
    //         'products': booked_product,
    //         'issue': issue
    //     }
    // }
    // let res = await fetch(`/api/bookingdetail/${booking_id}/`, {
    //     method: 'PUT',
    //     headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
    //     body: JSON.stringify(senddata),
    // })
    // if(res.ok){
    //     let data = await res.json()
    //     Swal.fire({
    //         position: 'bottom-end',
    //         icon: 'success',
    //         title: 'Booking has been updated',
    //         showConfirmButton: false,
    //         timer: 1500
    //     })
    // }
})
let saved_booking_id;

// Delete the booking
$('.delete-booking-button').on('click', async function(){
    let booking_id = $(this).attr('data-id')
    deleteBooking(booking_id)
})
$(document).on('change', '#selectedissuetext', async function(){
    let data = await fetchSelectedBooking(saved_booking_id)
    calculateTotalBalance(data)
})

// $(document).on('change', '#display_spare_edit', async function(){
//     let data = await fetchSelectedBooking(saved_booking_id)
//     calculateTotalBalance(data)
// })

function deleteBooking(booking_id){
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
            const csrftoken = getCookie('csrftoken'); // HERE: get the token

            let res = await fetch(`/api/bookingdetail/${booking_id}`,{
                method:'DELETE',
                headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
            })
            if(res.ok){
                $('#bookingdetailModal').modal('toggle')
                Swal.fire({
                    position: 'bottom-end',
                    icon: 'success',
                    title: 'Booking successfully deleted!',
                    showConfirmButton: false,
                    timer: 1500
                })
                $('div').find(`[data-booking=${booking_id}]`).fadeOut();
            }   
          Swal.fire(
            'Deleted!',
            'Your file has been deleted.',
            'success'
          )
        }
    })
}
//------------------------------------------------End of booking-----------------------------------//
// Saving the new request

async function saveSpareRequest(brand, product, issue){
    send_data = {
        'brand': brand,
        'model': product,
        'issue': 'Spares',
        }
    
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 
    let res = await fetch('/api/newrequest/', {
        method: 'POST',
        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        body: JSON.stringify(send_data)
    })
    if(res.ok){
        let data = await res.json()
        Swal.fire(
            'Good job!',
            'You successfully sent request!',
            'success'
        )
        $('.issue-list').html(`
        <tr class="text-center">
            <td colspan="3">
                <p class="text-center fs-5 text-success">Successfully created your request!</p>
            <td
        </tr>  `)
    }
}

// Filling Request form data based on display type
$(document).on('change', '.display_type', function(){
    if($(this).val() == 'LED'){
        $(this).parents().parents().siblings('form').find('.rows-0').find('.quality').val('COPY LED').attr('disabled', true)
        $(this).parents().parents().siblings('form').find('.rows-1').find('.quality').val('COPY LCD').attr('disabled', true)
        $(this).parents().parents().siblings('form').find('.rows-2').find('.quality').val('CARE OG').attr('disabled', true)
    }else if($(this).val() == 'LCD'){
        $(this).parents().parents().siblings('form').find('.rows-0').find('.quality').val('COPY').attr('disabled', true)
        $(this).parents().parents().siblings('form').find('.rows-1').find('.quality').val('AAA').attr('disabled', true)
        $(this).parents().parents().siblings('form').find('.rows-2').find('.quality').val('CARE OG').attr('disabled', true)
    }
})
$(document).ready(function(){
    $('.display_type').map((i, element) => {
        if($(element).val() == 'LED'){
            $(element).parents().parents().siblings('form').find('.rows-0').find('.quality').val('COPY LED').attr('disabled', true)
            $(element).parents().parents().siblings('form').find('.rows-1').find('.quality').val('COPY LCD').attr('disabled', true)
            $(element).parents().parents().siblings('form').find('.rows-2').find('.quality').val('CARE OG').attr('disabled', true)
        }else if($(element).val() == 'LCD'){
            $(element).parents().parents().siblings('form').find('.rows-0').find('.quality').val('COPY').attr('disabled', true)
            $(element).parents().parents().siblings('form').find('.rows-1').find('.quality').val('AAA').attr('disabled', true)
            $(element).parents().parents().siblings('form').find('.rows-2').find('.quality').val('CARE OG').attr('disabled', true)
        }
    });
})
$(document).ready(function() {
    $("#issue_select").bsMultiSelect({
        placeholder:'Please select issue*',
        required:true,
    });
});
// Fetch store details
async function fetchStoreDetails(id){
    $('#storeDelete').show();
    $('#storeDelete').attr('data-id', id);
    let res = await fetch(`/api/stores/${id}/`, {
        method: 'GET'
    })
    if(res.ok){
        let data = await res.json()
        $('#storeName').val(data['store_name'])
        if(data['manager'] !=null){
            $('#manager').val(`${data['manager']['name']}|${data['manager']['phone']}`)
            // data['manager']['name'] != 'Anonymous' ? $('#manager').val(data['manager']['name']) : $('#manager').val(data['manager']['phone'])
        }else if(data['manager'] ==null){
            $('#manager').val("");
        }
    }
    // fetch all staff
    let staff_res = await fetch(`/api/store/staff/${id}/`, {method:'GET'})
    if(staff_res.ok){
        let staff_data = await staff_res.json();
        $('#staff_select').html('')
        let user_res = await fetch(`/user/users/`, {method: 'GET'})
        if(user_res.ok){
            let user_data = await user_res.json()
            user_data.map((e,i)=>{
                $('#staff_select').append(`
                    <option value="${e.id}">${e.name} | ${e.phone}</option>
                `)
                staff_data.map((staff,i)=>{
                    if(e.id === staff.staff.id){
                        $(`#staff_select option[value=${staff.staff.id}]`).attr('selected', true)
                    }
                })
            })
            
        }

        $('#staff_select').select2({
            placeholder: 'Select staff'
        });
    }
    $('#store-form').attr('data-store', 'edit')
}
async function newStore(){
    $('#storeDelete').hide();
    $('#storeName').val('')
    $('#manager').val('')
    $('#staff_select').html('')
    let res = await fetch(`/user/users/`, {method: 'GET'})
    if(res.ok){
        let data = await res.json()
        data.map((e,i)=>{
            $('#staff_select').append(`
                <option value="${e.id}">${e.name} | ${e.phone}</option>
            `)
            $('#staff_select').select2({
                placeholder: 'Select staff'
            });
        })
    }
    $('#store-form').attr('data-store', 'new')
}
let users_list = []
// Get all Brands
fetch('/user/users/').then(res=>res.json()).then(data=>{
    data.map((i,e)=>{
        // s.push({'value': `${i.name}|${i.model_no}`, 'product':`${i.name}` , 'model': `${i.model_no}`})
        users_list.push({'value': `${i.name} | ${i.phone}`})
    })
})
// Autocomplete
const ManagerAutoComplete = new autoComplete({
    selector: "#manager",
    data: {
        src: users_list,
        keys: ["value"],

        cache: true,
    },
    searchEngine: "loose",
    resultsList: {
        class: "text-capitalize",
        element: (list, data) => {
            if (!data.results.length) {
                // Create "No Results" message element
                const message = document.createElement("div");
                // Add class to the created element
                message.setAttribute("class", "no_result");
                // Add message text content
                message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                // Append message element to the results list
                list.prepend(message);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                ManagerAutoComplete.input.value = selection.value;
            }
        }
    }
})

// Saving new & edit store
$(document).on('submit','form#store-form', async function(e){
    e.preventDefault();
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 

    let data = {
        'store_name': $('#storeName').val(),
        'manager': $('#manager').val(),
        'staff': $('#staff_select').val()
    }
    $('#store-submit-btn').attr('disabled', true).html('<img src="../../../static/serviceAdmin/img/loader.svg" height="30" width="30" alt="">')
    if($('#store-form').attr('data-store') == 'new'){
        let res = await fetch('/api/stores/', {
            method: 'POST',
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken }, 
            body: JSON.stringify(data)
        })
        if(res.ok){
            Swal.fire({
                icon: 'success',
                title: 'Changes saved',
                text: 'Successfully saved your changes!'
            })
            let data = await res.json()
            $('.all-stores-list').prepend(`
                <div class="col-md-4" data-store="${data['id']}">
                    <div class="card" style="background-color: #f4f4c6;" onclick="fetchStoreDetails(${data['id']})" data-bs-toggle="modal" data-bs-target="#storeDetailModal">
                        <div class="card-body">
                            <p>
                                ${data['store_name']}
                            </p>
                            <div class="text-muted">
                                Manager: ${data['manager_detail']} 
                            </div>
                        </div>
                    </div>
                </div>
            `)
            $('#storeDetailModal').modal('toggle')
            $('#store-submit-btn').attr('disabled', false).text('Submit')
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops',
                text: 'Sorry something went wrong!'
            })
            $('#store-submit-btn').attr('disabled', false).text('Submit')
        }
    } else if($('#store-form').attr('data-store') == 'edit'){
        const store_id = $('#storeDelete').attr('data-id');
        let res = await fetch(`/api/stores/${store_id}/`, {
            method: 'PUT',
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken }, 
            body: JSON.stringify(data)
        })
        if(res.ok){
            Swal.fire({
                icon: 'success',
                title: 'Changes saved',
                text: 'Successfully saved your changes!'
            })
            $('#store-submit-btn').attr('disabled', false).text('Submit')
            fetchStoreDetails(store_id)
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops',
                text: 'Sorry something went wrong!'
            })
            $('#store-submit-btn').attr('disabled', false).text('Submit')
        }
    }
})
$(document).on('click','#storeDelete', async function(){
    const store_id = $(this).attr('data-id');
    const csrftoken = getCookie('csrftoken'); // HERE: get the token 
    $('#storeDelete').attr('disabled', true).html('<img src="../../../static/serviceAdmin/img/loader.svg" height="30" width="30" alt="">')
    let res = await fetch(`/api/stores/${store_id}/`,
    {
        method:'delete',
        headers:{'Content-type': 'application/json', "X-CSRFToken": csrftoken }
    }
     );
    if(res.ok){
        Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Successfully deleted the store!'
        })
        $(".all-stores-list").find(`[data-store='${store_id}']`).remove()
        $('#storeDetailModal').modal('toggle');
        $('#storeDelete').attr('disabled', false).text('Delete');
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops',
            text: 'Sorry something went wrong!'
        })
        $('#storeDelete').attr('disabled', false).text('Delete');
    }
})

// Report Chart
async function graphData(){
    let res = await fetch(`/api/graph_data/`)
    const monthNames = ["Jan", "Feb", "Mar", "April", "May", "June",
                        "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if(res.ok){
        let data = await res.json()
        const graph_data = []
        data.map((each)=>{
            const data_res = new Date(each.date_created)
            graph_data.push({
                'total_payment': each.total_payment,
                'date': `${data_res.getDate()} ${monthNames[data_res.getMonth()]} ${data_res.getFullYear()}`
            })
        })
        return graph_data
    }
}


const types = ['line', 'stackedline', 'fullstackedline'];
  
$(async () => {
    const dataSource = await graphData()
    console.log(dataSource)
    const chart = $('#chart').dxChart({
      palette: 'Violet',
      dataSource,
      commonSeriesSettings: {
        argumentField: 'date',
        type: types[0],
      },
      margin: {
        bottom: 20,
      },
      argumentAxis: {
        valueMarginsEnabled: false,
        discreteAxisDivisionMode: 'crossLabels',
        grid: {
          visible: true,
        },
      },
      series: [
        // { valueField: 'hydro', name: 'Enquiry' },
        { valueField: 'total_payment', name: 'Sales' },
      ],
      legend: {
        verticalAlignment: 'bottom',
        horizontalAlignment: 'center',
        itemTextPosition: 'bottom',
      },
      title: {
        text: 'Sales Report in 2022',
      },
      export: {
        enabled: true,
      },
      tooltip: {
        enabled: true,
      },
    }).dxChart('instance');
  
    $('#types').dxSelectBox({
      dataSource: types,
      value: types[0],
      onValueChanged(e) {
        chart.option('commonSeriesSettings.type', e.value);
      },
    });
  });

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

async function calculateAmount() {
    let newtoday = new Date();
    var firstDay = new Date(newtoday.getFullYear(), newtoday.getMonth(), 1);
    let current_day = new Date(newtoday.getFullYear(), newtoday.getMonth(), newtoday.getDate())
    let month_start = `${firstDay.getDate()}-${firstDay.getMonth()+1}-${firstDay.getFullYear()}`
    let today_date = `${current_day.getDate()}-${current_day.getMonth()+1}-${current_day.getFullYear()}`
    // Need to filter bookings & orders
    let res = await fetch(`/api/bookingdetails/?filter=${true}&start_date=${month_start}&end_date=${today_date}`, {
        method: 'GET',
    })
    if(res.ok){
        let data = await res.json()
        total_order_amount = 0
        total_advance_amount = 0

        data.map((i, e)=>{
            total_order_amount += parseInt(i['total_payment'])
        })
        data.map((i, e)=>{
            total_advance_amount += parseInt(i['advance_payment'])
        })

        $('.order_payment').text(`₹${total_order_amount.toLocaleString('en-IN')}`)
        $('.total_advance_amount').text(`₹${total_advance_amount.toLocaleString('en-IN')}`)
    }
}

// Report filters
$(document).ready(function(){
    var today = new Date();
    var picker = tui.DatePicker.createRangePicker({
        startpicker: {
           
            input: '#startpicker-input',
            container: '#startpicker-container'
        },
        endpicker: {
            input: '#endpicker-input',
            container: '#endpicker-container'
        },
        type: 'date',
        format: 'dd-MM-yyyy',
        selectableRanges: [
            [today, new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())]
        ],
    })

    picker.on('change:end', ()=>{
        $('#clear-btn').removeClass('d-none');
        start_date_send = $('#startpicker-input').val()
        end_date_send = $('#endpicker-input').val()
        let order_or_enq =  $('#order_or_enq').val() === '' ? undefined : $('#order_or_enq').val()
        let store = $('#store_set').val()  === '' ? undefined : $('#store_set').val()

        filterBooking({'start_date': start_date_send, 'end_date': end_date_send,'ord_enq': order_or_enq,'store': store})
    });
    $(document).on('change','.filter', function(){
        $('#clear-btn').removeClass('d-none');
        start_date_send = $('#startpicker-input').val()
        end_date_send = $('#endpicker-input').val()
  
        let order_or_enq =  $('#order_or_enq').val() === '' ? undefined : $('#order_or_enq').val()
        let store = $('#store_set').val()  === '' ? undefined : $('#store_set').val()
        filterBooking({'start_date': start_date_send, 'end_date': end_date_send, 'ord_enq': order_or_enq, 'store': store})
    })
    
    $('#showbookingreport').on('shown.bs.modal', async function (e) {
        $('.report_booking_container').text("");
        $('.report_booking_container').html('<img src="../../../static/serviceAdmin/img/loader.svg" height="30" width="30" alt="">');
        fetchEnqOrders()
    })
    $(document).on('click','#clear-btn', function(){
        fetchEnqOrders();
        $(this).addClass('d-none');
        picker.removeRange($('#startpicker-input').val(), $('#endpicker-input').val(), null)
        // selectDefault({'id':'order_or_enq'})
        $(`#order_or_enq option`).prop('selected', function () {
            return this.defaultSelected;
        });
        $(`#store_set option`).prop('selected', function () {
            return this.defaultSelected;
        });
        $('#startpicker-input').val('')
        $('#endpicker-input').val('')
    })
    calculateAmount()
})
function selectDefault(...allid){
    id = {...allid}
   
    for(let eachid in id){
        $(`#${eachid['id']} option`).prop('selected', function () {
            return this.defaultSelected;
        });
    }
}
async function fetchEnqOrders() {
    let res = await fetch('/api/bookings/', {
        method: 'GET'
    })
    if(res.ok){
        let data = await res.json()
        $('.report_booking_container').text("");
        data.map(res=>{
            const booking_date = new Date(res.date_created)
            const booking_time = formatAMPM(booking_date)
            $('.report_booking_container').append(`
                <div class="col-md-3">
                    <div class="card each-booking px-2 py-3" data-booking="${res.pk}">
                        <div class="line"></div>
                        <div class="booking-card-detail">
                            <p class="m-0 p-0"><b>${res.name}</b></p>
                            <span class="text-muted">${res.assignee ? res.assignee : 'No Assignee'}</span>
                        </div>
                        <span class="position-absolute text-muted" style="right: 5px;">
                        ${booking_date.getDate().toString()}-${booking_date.getMonth().toString()}-${booking_date.getFullYear().toString()}
                        </span>
                        <span class="position-absolute text-muted" style="right: 5px; top: 32px;">
                            <i class="bx bx-time align-middle"></i><span style="font-size:0.8em;">${booking_time}</span>
                        </span>
                    </div>
                </div>
            `)  
        })
    }
}
async function filterBooking(...data){
    $('.report_booking_container').text("");
    $('.report_booking_container').html('<img src="../../../static/serviceAdmin/img/loader.svg" height="30" width="30" alt="">');
    
    let  send_data ={...data}
    console.log(send_data)
    let res = await fetch(`/api/bookings/?filter=${true}&start_date=${send_data[0]['start_date']}&end_date=${send_data[0]['end_date']}&eo=${send_data[0]['ord_enq']}&store=${send_data[0]['store']}`, {
        method: 'GET',
    })
    if(res.ok){
        data = await res.json()
        $('.report_booking_container').text("");
        data.map(res=>{
            const booking_date = new Date(res.date_created)
            const booking_time = formatAMPM(booking_date)
            $('.report_booking_container').append(`
                <div class="col-md-3">
                    <div class="card each-booking px-2 py-3" data-booking="${res.pk}">
                        <div class="line"></div>
                        <div class="booking-card-detail">
                            <p class="m-0 p-0"><b>${res.name}</b></p>
                            <span class="text-muted">${res.assignee ? res.assignee : 'No Assignee'}</span>
                        </div>
                        <span class="position-absolute text-muted" style="right: 5px;">
                        ${booking_date.getDate().toString()}-${booking_date.getMonth().toString()}-${booking_date.getFullYear().toString()}
                        </span>
                        <span class="position-absolute text-muted" style="right: 5px; top: 32px;">
                            <i class="bx bx-time align-middle"></i><span style="font-size:0.8em;">${booking_time}</span>
                        </span>
                    </div>
                </div>
            `)  
        })
    }
}
// fill alternate mobile number as primary mobile number
// price maintanence - Autofilling AAA with copy + 500
$(document).ready(function(){
    $(document).on('click','.autofill-alter-number', function(){
       $(this).siblings('.alternateno').val($(this).closest('.form-floating').siblings('.form-floating').first().find('.primaryno').val())
    })
    $(document).on('change','.price', function(){
        if($(this).parents().siblings('.quality-input').first().find('.quality').val() === 'AAA'){
            $(this).parents().siblings('.quality-input').first().find('.price').val(500+parseInt($(this).val()))
        }
    })
})

// submit and next order progress
// Update details
$(document).on('click', '.save_booking_update', async function(e){
    e.preventDefault();
    const booked_mob_no = $('#bookedmobno').val()
    const booking_alter_no = $('#bookedalternatebookingno').val()
    const booked_name = $('#bookedname').val()
    const booked_mob_pin = $('#booked_mobile_pin').val()
    const booked_product = $('#bookedProduct').val()
    const is_verified = $('#verified_checkbox').is(":checked")
    let model_no = booked_product.split('|')[1]
    const brand = $('#bookedbrand').val()
    const selectedissuetext = $('#selectedissuetext').val()
    // const display_selected_spare = $('#display_spare_edit').val()
    const edit_selected_spare = $('.change-spare:checked');
    const total_payment = await summary.calculateChangeTotalAmount()
    const other_issue = summary.other_issue
    const battery_service = $('#batteryServiceCharge').is(':checked');
    const cc_board = $('#ccboardOption').is(':checked');

    let booking_detail_data;

    if(model_no == undefined){
        model_no = booked_product
    }
    let booking_for_data = {
        "mobile": booked_mob_no,
        "alternate_mobile": booking_alter_no,
        "name": booked_name,
        "is_verified":is_verified,
    }
        
  
    booking_detail_data = {
        "model_no": model_no,
        "brand": brand,
        "issue":selectedissuetext,
        "mobile_pin":booked_mob_pin,
        // "selected_spare": [parseInt(display_selected_spare)],
        "other_issue": other_issue,
        "total_payment": total_payment,
        "product": booked_product,
        'selected_spare': [],
        'is_charger_cc_board':cc_board,
        'service_charge': battery_service,
    }
    
    // getting selected spares
    edit_selected_spare.map((i, e)=>{
        booking_detail_data['selected_spare'].push($(e).attr('id'))
    })

    const csrftoken = getCookie('csrftoken'); // HERE: get the token
    let res = await fetch(`/api/bookingstatus/updates/${$(this).attr('data-key')}/`, {
        method: 'PUT',
        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        body: JSON.stringify(booking_for_data)
    })

    if(res.ok){
        let booking_detail_res = await fetch(`/api/updatebooking/${$(this).attr('data-key')}/`, {
            method: 'PUT',
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
            body: JSON.stringify(booking_detail_data)
        })
        if(booking_detail_res.ok){
            Swal.fire({
                icon: 'success',
                title: 'Saved',
                text: 'Changes Saved Successfully!'
            })

            fetchBookings($('.active').attr('data-link'))
            if(is_verified){
                filleachbookings($(this).attr('data-key'))
                $('.first-stage-booking').hide();
                $('.verified-bookings').show();
                $('.save_detail_updates').attr('data-key',`${$(this).attr('data-key')}`)
            }
            $('#verified_checkbox').prop('checked', false)
            location.reload();
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops',
                text: 'Something went wrong!'
            })
        }
    }
})
// filling each booking
async function filleachbookings(saved_booking_id){
    let res = await fetch(`/api/bookingdetail/${saved_booking_id}`,{
        method: 'GET',
    })
    if(res.ok){
        let data = await res.json()
        $('.bookings').hide()
        $('.verified_remarks').val(`${data.booking_for.remark != null ? data.booking_for.remark : ''}`)
        $('.delete-booking-button').attr('data-id', saved_booking_id)
        
        if(data.booking_for.order_status == 'Bookings'){
            $('#booking_detail_modal_label').text('Booking Details');
            $('.first-stage-booking').show()
            let selected_multiselect_options = ({
                placeholder:'Please select issue*',
            });
            $('.save_detail_updates').attr('data-key',`${data.booking_for.pk}`)
            if(data.booking_for.is_verified){
                $('#verified_checkbox').attr('checked', true)
            }else{
                $('#verified_checkbox').attr('checked', false)
            }
            
            if(parseFloat(data.total_payment) !== 0 ){
                let bal_payment = parseFloat(data.total_payment) - parseFloat(data.advance_payment)
    
                $('.edit-balance-amount').text(`₹${bal_payment.toFixed(2)}`)
                $('.edit-advance-amount').text(`₹${data.advance_payment}`)
                $('.edit-total-amount').text(`₹${data.total_payment}`)
            }else if(parseFloat(data.advance_payment) !== 0 && !parseFloat(data.total_payment)){
                $('.edit-balance-amount').text(`Unknown balance payment`)
                $('.edit-advance-amount').text(`₹${data.advance_payment}`)
                $('.edit-total-amount').text(`No Total Amount`)
            }
            else{
                $('.edit-balance-amount').text(`No balance Payment`)
                $('.edit-advance-amount').text(`No Advance paid`)
                $('.edit-total-amount').text(`No Total Amount`)
            }

            $('#bookedmobno').val(data.booking_for.mobile)
            $('#bookedalternatebookingno').val(data.booking_for.alternate_mobile)
            $('#bookedname').val(data.booking_for.name)
    
            $('#booked_mobile_pin').val(data.mobile_pin)
            $('#bookedname').data('id', saved_booking_id)
            if(data.brand_alter){
                $('#bookedbrand').val(data.brand_alter)
            }else{
                $('#bookedbrand').val(`${data.brands}`)
            }
            if(data.product_alter){
                $('#bookedProduct').val(data.product_alter)
            }else{
                $('#bookedProduct').val(`${data.products}`)
            }
            // removing all selected attributes
            $('.selectedissuetext option').each((i,e)=>{
                $(e).prop("selected", false);
            })
            
            let $selected_multiselect = $('#selectedissuetext')
            $selected_multiselect.bsMultiSelect()
            
            $('.selectedissuetext option').each((i,e)=>{
                data.issue.map((eachItem,index)=>{
                    if($(e).val().toLowerCase() == eachItem.issue_name.toLowerCase()){
                        $(e).prop("selected", true);
                    }
                })
                $selected_multiselect.data('DashboardCode.BsMultiSelect').updateOptionSelected(i);
                // selected_multiselect.updateOptionSelected()
            })
            // $('#selectedissuetext').val(data.issue)
            // $('#selectedissuetext option:selected')
            $('.booking-btn').data('id', `${data.pk}`)
            // Getting spares for each issue for that particular model
            data.issue.map(async(e,i)=>{
                if(e.issue_name == 'Display'){
                    const product_model_input = $('#bookedProduct').val().split('|')
                    const dis_res = await sparedatachange('Display',product_model_input[0], product_model_input[1], data)
                }
            })

        }else if(data.booking_for.order_status == 'Confirmed Orders'){
            $('#booking_detail_modal_label').text('Verified order details');
            $('.verified-bookings').show();
            $('.con_mobile_no').text(` ${data.booking_for.mobile}`)
            $('.con_alter_mobile_no').text(`${data.booking_for.alternate_mobile}`)
            $('.con_name').text(`${data.booking_for.name}`)
            $('.con_brand').text(`${data.brands}`)
            $('.con_product').text(`${data.products}`)
            $('.con_mobile_pin').text(`${data.mobile_pin}`)
            $('.con_issues').text('')
            $('.save_detail_updates').attr('data-key',`${data.booking_for.pk}`)
            data.issue.map((e,i)=>{
                $('.con_issues').append(`
                    ${e.issue_name},
                `)
            })
        }
        
    }
    let responses = await fetchCustomerResponses(saved_booking_id);
    if(responses.error){
        $('.detail-customer-responses').html(`<p style="color:red;">Questions cannot be loaded, Something went wrong! </p>
        <button class="btn btn-sm btn-primary rounded-pill" onclick="fetchCustomerResponses(${saved_booking_id})">Try again</button>`)
    } else{
        $('.detail-customer-responses').html('');
        responses.map((element, i)=>{
            $('.detail-customer-responses').append(`
                <div class="question">
                    <label class="form-label" for="${i}"> ${element.question} </label>
                    <div class="response mb-2">
                        <select class="form-control customer-response" data-question="${element.question}" type="text" id="${i}">
                            <option value="Yes" ${element.response == 'Yes' && 'selected'}>Yes</option>
                            <option value="No" ${element.response == 'No' && 'selected'}>No</option>
                        </select>
                    </div>
                </div>
            `);
        })
    }
    $("#selectedissuetext").bsMultiSelect({
        placeholder:'Please select issue*',
        required:true,
    });
}
async function fetchConfirmedProgress(saved_booking_id){
    let res = await fetch(`/api/bookingdetail/${saved_booking_id}`,{
        method: 'GET',
    })
    if(res.ok){
        let data = await res.json()
        $('.bookings').hide()
        $('.verified_remarks').val(`${data.booking_for.remark != null ? data.booking_for.remark : ''}`)
        $('.delete-booking-button').attr('data-id', saved_booking_id)
        if(data.booking_for.order_status == 'In Progress'){
            $('#booking_detail_modal_label').text('Orders in queue');
            $('.progress-bookings').show();
            $('.progress_mobile_no').text(` ${data.booking_for.mobile}`)
            $('.progress_alter_mobile_no').text(`${data.booking_for.alternate_mobile}`)
            $('.progress_name').text(`${data.booking_for.name}`)
            $('.progress_brand').text(`${data.brands}`)
            $('.progress_product').text(`${data.products}`)
            $('.progress_mobile_pin').text(`${data.mobile_pin}`)
            $('.progress_issues').text('')
            $('.save_completed_progress').attr('data-key',`${data.booking_for.pk}`)
            data.issue.map((e,i)=>{
                $('.progress_issues').append(`
                    ${e.issue_name},
                `)
            })
        }else if(data.booking_for.order_status == 'Ready for QC'){
            $('#booking_detail_modal_label').text('Orders for QC');
            fillQc(data.booking_for.pk)
            // $('.save_completed_progress').attr('data-key',`${data.booking_for.pk}`)
            $('.qc-bookings').show()
        }else if(data.booking_for.order_status == 'Delivery'){
            $('#booking_detail_modal_label').text('Orders for Delivery');
            $('.delivery-bookings').show()
            $('.delivery_mobile_no').text(` ${data.booking_for.mobile}`)
            $('.delivery_alter_mobile_no').text(`${data.booking_for.alternate_mobile}`)
            $('.delivery_name').text(`${data.booking_for.name}`)
            $('.delivery_brand').text(`${data.brands}`)
            $('.delivery_product').text(`${data.products}`)
            $('.delivery_mobile_pin').text(`${data.mobile_pin}`)
            $('.delivery_issues').text('')
            $('.save_delivered_progress').attr('data-key',`${data.booking_for.pk}`)
            data.issue.map((e,i)=>{
                $('.delivery_issues').append(`
                    ${e.issue_name},
                `)
            })
        }else if(data.booking_for.order_status == 'Order Completed'){
            $('.completed-bookings').show();
            $('#booking_detail_modal_label').text('Orders for Delivery');
            $('.completed_mobile_no').text(` ${data.booking_for.mobile}`)
            $('.completed_alter_mobile_no').text(`${data.booking_for.alternate_mobile}`)
            $('.completed_name').text(`${data.booking_for.name}`)
            $('.completed_brand').text(`${data.brands}`)
            $('.completed_product').text(`${data.products}`)
            $('.completed_mobile_pin').text(`${data.mobile_pin}`)
            $('.completed_issues').text('')
            $('.save_delivered_progress').attr('data-key',`${data.booking_for.pk}`)
            data.issue.map((e,i)=>{
                $('.completed_issues').append(`
                    ${e.issue_name},
                `)
            })
        }
    }
}
// Fill QC forms
async function fillQc(booking_pk){
    $('.save_question_progress').attr('data-key',`${booking_pk}`)
    $('.questions_container').html('')
    let customer_response = await fetch(`/api/filter_ques/?qs=QC&id=${booking_pk}`)
    if(customer_response.ok){
        let customer_data = await customer_response.json()

        customer_data.map((e,i)=>{
            $('.questions_container').append(`
            <div class="question">
                <label class="form-label" for="1">${e.question}</label>
                <div class="response mb-2">
                    <select class="form-control question-response" data-question="${e.id}" type="text" id="1">
                        <option value="Yes"${e.response == 'Yes'&& 'selected'}>Yes</option>
                        <option value="No" ${e.response == 'No'&& 'selected'}>No</option>
                    </select>
                </div>
            </div>
        `)
        })
        
    }
}
// separate page tasks save
$(document).on('click', '.save_progress', async function(e){
    e.preventDefault()
    let send_data;
    const csrftoken = getCookie('csrftoken'); // HERE: get the token

    if($(this).hasClass('save_verified_progress')){
        let remark = $('.verified_remarks').val()
        const markInProgress = $('#markInProgress').is(":checked")

        if (markInProgress){
            order_status = 'IP'
        }else{
            order_status = 'CB'
        }
        send_data = {
            'remark': remark,
            'order_status': order_status,
        }
    }else if($(this).hasClass('save_completed_progress')){
        const readyForQC = $('#ready_for_qc').is(":checked")
        let remark = $('.progress_remarks').val();
        if (readyForQC){
            order_status = 'QC'
        }else{
            order_status = 'IP'
        }
        send_data = {
            'remark': remark,
            'order_status': order_status,
        }
    }
    else if($(this).hasClass('save_delivered_progress')){
        const order_completed = $('#order_completed').is(":checked")
        const open_booking = $('#open_booking').is(":checked")
        let remark = $('.delivery_remarks').val();
        if (order_completed){
            order_status = 'OC'
        }else{
            order_status = 'DD'
        }
        if(open_booking){
            order_status = 'CB'
        }
        send_data = {
            'remark': remark,
            'order_status': order_status,
        }
    }
    let res = await fetch(`/api/bookingstatus/updates/${$(this).attr('data-key')}/`, {
        method: 'PUT',
        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        body: JSON.stringify(send_data)
    })
    if(res.ok){
        Swal.fire({
            icon: 'success',
            title: 'Saved',
            text: 'Changes Saved Successfully!'
        });
        res_data =await res.json()
        console.log(res_data['order_status'])
        if(res_data['order_status'] == 'QC'){
            $('.progress-bookings').hide();
            $('.qc-bookings').show();
            fillQc($(this).attr('data-key'))
        }
        if(res_data['order_status'] == 'IP'){
            $('#booking_detail_modal').modal('toggle');
        }
        // $('#booking_detail_modal').modal('toggle');
        fetchBookings($('.active').attr('data-link'));
        $('#markInProgress').prop('checked', false);
        $('#ready_for_qc').prop('checked', false);
        $('#open_booking').prop('checked', false);
        $('#order_completed').prop('checked', false);
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops',
            text: 'Something went wrong!'
        });
    }
})
$(document).on('click', '.save_question_progress', async function(e){
    e.preventDefault();

    const readyForDelivery = $('#ready_for_delivery').is(":checked")
    let remark = $('.qc_remarks').val()

    const csrftoken = getCookie('csrftoken'); // HERE: get the token
    if (readyForDelivery){
        order_status = 'DD'
    }else{
        order_status = 'QC'
    }
    send_data = {
        'remark': remark,
        'order_status': order_status,
    }
    let res = await fetch(`/api/bookingstatus/updates/${$(this).attr('data-key')}/`, {
        method: 'PUT',
        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        body: JSON.stringify(send_data)
    })
    if(res.ok){
        question_res_data = []
        $('.question-response').each(function(i,e){
            // question_res_data.id = $(e).attr('data-question')
            // question_res_data.response = $(e).val()
            question_res_data.push({
                'id': $(e).attr('data-question'),
                'response': $(e).val()
            })
        })

        let customer_response = await fetch(`/api/filter_ques/`, {
            method: 'PUT',
            headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
            body: JSON.stringify(question_res_data)
        })
        if(customer_response.ok){
            Swal.fire({
                icon: 'success',
                title: 'Saved',
                text: 'Changes Saved Successfully!'
            })
            $('#booking_detail_modal').modal('toggle');
            fetchBookings($('.active').attr('data-link'))
            $('#ready_for_delivery').prop('checked', false);
        }
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops',
            text: 'Something went wrong!'
        })
    }
})

// Get device location
let allowGeoRecall = true;
let countLocationAttempts = 0;

function getLocation() {
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition, positionError)
       
    }else {
        $('.store').text("Geo location not supported!")
    }
}
function positionError() {    
    $('.store').text('Geolocation is not enabled. Please enable to use this feature')
        
     if(allowGeoRecall && countLocationAttempts < 5) {
        countLocationAttempts += 1;
        getLocation();
     }
 }
function showPosition(position){
    // $('.store').text(`${position.coords.latitude} ${position.coords.longitude}`)
    //My Location - 12.943927149592813, 80.15065843999894

    if(parseFloat(position.coords.latitude).toFixed(2) == 10.88 && parseFloat(position.coords.longitude).toFixed(2) == 76.90){
        $('.store').text("Finetune, Ettimadai Store")
    }else{
        $('.store').text(`${parseFloat(position.coords.latitude).toFixed(2)}, ${parseFloat(position.coords.longitude).toFixed(2)}`)
    }
    allowGeoRecall = false;
    // 10.883917031399186, 76.9097381749403
}
$(document).ready(function(){
    getLocation()
})
async function fillQuestion(question_set) {
    const res = await fetch(`/api/question/detail/${question_set}/`,{
        method: 'GET',
    })
    $('.question_list').text('')
    if(res.ok){
        const data = await res.json()

        data.map((e,i)=>{

            $('.question_list').append(`
                <div class="card question-card">
                    <div class="card-body ">
                        <div class="float-start position-relative question-text" style="top: 8px;">${e.question}?</div><button class="float-end question-delete-btn btn text-danger" data-id="${e.id}"><i class="bx bx-trash"></i></button> 
                        <input type="text" class="form-control question-input position-absolute d-none" data-id="${e.id}" style="top: 8px; width: 80%;" value="${e.question}">
                    </div>
                </div>
            `)
        })
        $('.add-new-question').attr('data-qs', question_set)
    }
}
$(document).on('click', '.question-text', function(){
    $(this).siblings('.question-input').first().removeClass('d-none').focus();
})
$(document).on('blur', '.question-input', function(){
    editquestion($(this))
    $(this).addClass('d-none');
})
$(document).on('keyup', '.question-input', function(e){
    if(e.key === 'Enter'){
        $(this).addClass('d-none');
    }
})
async function editquestion(input){
    id = input.attr('data-id')
    const csrftoken = getCookie('csrftoken');
    const data = {
        'question': input.val()
    }

    let res = await fetch(`/api/question/edit/${id}/`,{
        method: 'PUT',
        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
        body: JSON.stringify(data)
    })
    if(res.ok){
        const data = await res.json()
        $(input).siblings('.question-text').text(input.val())
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong!'
        })
    }
}
$(document).on('click','.add-new-question', async function(){
    const question = $('.new-question-input').val()
    const qs = $(this).attr('data-qs')
    const csrftoken = getCookie('csrftoken');

    const data = {
        'question_set_name': qs,
        'question': question
    }
    const res = await fetch(`/api/questions/`,{
        method:'POST',
        body: JSON.stringify(data),
        headers:{"Content-Type": "application/Json","X-CSRFToken": csrftoken },
    })
    if(res.ok){
        const data = await res.json()
        $('.question_list').append(`
            <div class="card question-card">
                <div class="card-body ">
                    <div class="float-start position-relative question-text" style="top: 8px;">${data.question}?</div><button class="question-delete-btn float-end btn text-danger" data-id="${data.id}"><i class="bx bx-trash"></i></button> 
                    <input type="text" class="form-control question-input position-absolute d-none" data-id="${data.id}" style="top: 8px; width: 80%;" value="${question}">
                </div>
            </div>
        `)
        $('.new-question-input').val('')
    }
})
$(document).on('click', '.question-delete-btn', async function(){
    const id = $(this).attr('data-id');
    const csrftoken = getCookie('csrftoken');

    const res = await fetch(`/api/question/edit/${id}/`, {
        method:'DELETE',
        headers:{'Content-type': 'application/json', "X-CSRFToken": csrftoken }
    })
    if(res.ok){
        $(this).parents().parents('.question-card').remove()
    }
})

// Custom Generic Modal
class SecondaryModal {
    constructor (modal_pop) {
        this.modal_pop = modal_pop
    }
    open() {
        $(this.modal_pop).addClass('show')
        $(this.modal_pop).css({'display': 'block'})
    }
    close(){
        $(this.modal_pop).removeClass('show')
        $(this.modal_pop).css({'display': 'none'})
    }
}

$(document).ready(function(){
    let modal_pop;
    $('.secondary-modal').css({'display': 'none'});
    $(document).on('click', '[data-cs-toggle]', function(){
        modal_pop = new SecondaryModal($(this).attr('data-cs-target'))
        modal_pop.open()

    })
    $(document).on('click','[data-cs-dismiss]', function(){
        if($(this).attr('data-cs-dismiss') == 'modal'){
            modal_pop.close()
        }
    })
    $(document).on('click', '.sec-modal-dialog', function(e){
        if(!$(e.target).closest(".modal-body").length)
        modal_pop.close()
    })
})

// diabling bs modal's keyboard input
// var booking_Modal = new bootstrap.Modal(document.getElementById('bookingdetailModal'), {
//     focus: false
// })

// var booking_Modal = new bootstrap.Modal(document.getElementById('booking_detail_modal'), {
//     focus: false
// })