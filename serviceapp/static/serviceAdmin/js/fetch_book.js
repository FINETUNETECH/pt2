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

$(document).ready(function(){
    // getting the nav tab on click
    fetchBookings($('.active').attr('data-link'))
    if($('.nav-link').hasClass('active')){
        window.history.replaceState(null, null, `?at=${$('.active').attr('data-link')}`);
        
    }
    $(document).on('click', '.nav-link', function(){
        
        window.history.replaceState(null, null, `?at=${$(this).attr('data-link')}`);
        $('.initial-booking').html('')
        fetchBookings($(this).attr('data-link'))
    })
})

async function fetchBookings(status){
    // all bookings
    $('.initial-booking').html('')
    fetch(`/api/bookings/?eo=cus`, {
        method: 'GET',
    }).then(res=>res.json()).then(data=>{
        bookings = data.filter(e=>e.order_status==status)
        if(bookings){
            bookings.map(res=>{
                const booking_date = new Date(res.date_created)
                const booking_time = formatAMPM(booking_date)
                $('.initial-booking').append(`
                    <div class="col-md-3">
                        <div class="card each-booking px-2 py-3" data-bs-toggle="modal" data-bs-target="#booking_detail_modal" data-booking="${res.pk}">
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
        }else{
            $('.initial-booking').append('No Bookings in this section')
        }
    })
}




function fillBookingForm(data){
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
}

$(document).on('click', '.each-booking', async function(){
    saved_booking_id = $(this).data('booking')
   
    let data = await fetchSelectedBooking(saved_booking_id)

        $('.bookings').hide()
        
        $('.verified_remarks').val(`${data.booking_for.remark != null ? data.booking_for.remark : ''}`)
        $('.delete-booking-button').attr('data-id', saved_booking_id)
        
        if(data.booking_for.order_status == 'Bookings'){
           
            fillBookingForm(data)
            const display_spare= data['selected_spare'].filter((e,i)=>{
                return e['spare_name']['name'] === 'Display'
            })
            
            summary = new OrderSummary(data, data.total_payment, data.advance_payment, data.issue, data.products, data.brands,display_spare.length ? display_spare[0].purchase_price : 0, data.other_issue)

            calculateTotalBalance(data);
            
            
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
        }else if(data.booking_for.order_status == 'In Progress'){
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
            $('.save_allbooking_question_progress').attr('data-key',`${data.booking_for.pk}`)
            $('.questions_container').html('')
            let customer_response = await fetch(`/api/filter_ques/?qs=QC&id=${data.booking_for.pk}`)
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
                        <select class="form-control customer-response" data-question="${element.question}" type="text" id="${i}" disabled>
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
});

$(document).on('change', '#bookedProduct', async function(){
    const product_model_input = $(this).val().split('|')
    const dis_res = await sparedatachange('Display', product_model_input[0], product_model_input[1])
})

$('#selectedissuetext').change(async function(){

    if($('#bookedProduct').val() != ''){
        if(!$(this).val().includes('Display')){
            // $('.spares-list-edit').html("")
            $('.spares-list-edit').addClass("d-none")
        }else{
           
            const product_model_input = $('#bookedProduct').val().split('|')
            // const dis_res = await sparedatachange('Display', product_model_input[0], product_model_input[1])
            $('.spares-list-edit').removeClass("d-none")

        }
    }
})
// Update details
$(document).on('click', '.save_allbooking_update', async function(e){
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
    console.log(total_payment)
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
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops',
                text: 'Something went wrong!'
            })
        }
    }
})
$(document).on('click', '.save_all_booking_progress', async function(e){
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
        $('#booking_detail_modal').modal('toggle');
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
$(document).on('click', '.save_allbooking_question_progress', async function(e){
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