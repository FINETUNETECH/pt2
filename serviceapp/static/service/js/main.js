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
let serviceClientDetails = {}
// Maps Api Connection
if(document.getElementById('mapForm') != null){
  document.getElementById('mapForm').onsubmit = async (e) =>{
    let locData = new FormData(mapForm);
    e.preventDefault();
    fetch('/', {
      method: 'POST',
      mode: 'same-origin',
      body: JSON.stringify(locData),
    }).then(res=>res.json()).then(data=>{
      console.log(data)
    }).catch(err=>console.log(err))
  }
}

// getting location availability
function validateAndNext(available,pincode=null, discover=false) {
  if(discover){
    let location = locationSearch.value;
    data = JSON.stringify({"location": location});
    const csrf = getCookie('csrftoken');
    fetch('validateavailability/', {
      method: 'POST',
      body: JSON.stringify({"location": location}),
      headers: {'X-CSRFToken': csrf}
    }).then(res=>res.json()).then(data=> {
      if(data['is_active'] == false){
        availableCall(false)
      }
      else if(data[0].fields.is_active == true){
        serviceClientDetails['location'] = data[0].fields.pincode;
        availableCall(true)
      }else if(data[0].fields.is_active != true){
        availableCall(false)
      } 
    }).catch(err=>console.log(err))
  } else{
    locationSearch.value = pincode;
    serviceClientDetails['location'] = pincode;
    availableCall(available)
  }
}
function availableCall(available){
  if(available){
    $('.locationError').removeClass('d-block');
    message.classList.remove('text-danger')
    message.classList.add('text-success')
    message.innerHTML = "Yay! We are available at your location"
    nextBtn.classList.remove('d-none')
  } else{
    message.classList.remove('text-success')
    message.classList.add('text-danger')
    message.innerHTML = "Sorry currently we are not available in your location"
    nextBtn.classList.add('d-none')
  }
}
// Autocomplete location
if(document.getElementById('locationSearch') != null && document.getElementById('locationSearch').value != null){
  let timeout = null;
  locationSearch.addEventListener('input', (event)=>{
    let locData = new FormData();
    clearTimeout(timeout);
    document.getElementById("autosuggestionList").innerHTML = "";
    if(locationSearch.value.length >= 2){
      locData.append('locationSearch', locationSearch.value);
      /*********Mapmyindia API CALL**************/
      /*timeout = setTimeout(()=>{
        fetch('/', {
          method: 'POST',
          mode: 'same-origin',
          body: locData,
        }).then(res=>res.json()).then(data=>{
          console.log(data)
          autosuggestion.classList.remove('d-none');
          for(i=0;i<2; i++){
            autosuggestionList.insertAdjacentHTML('afterbegin', 
            `
            <li class="list-group-item text-start">
              <a class="stretched-link text-decoration-none text-dark" href="">
                ${data.suggestedLocations[i].placeName}
                <p class="text-muted mb-0">${data.suggestedLocations[i].placeAddress}</p> 
              </a>
            </li>
            `
            )
          }
          
        }).catch(err=>console.log(err))
      },500) */
      timeout = setTimeout(()=>{
        fetch('/', {
          method: 'POST',
          mode: 'same-origin',
          body: locData,
        }).then(res=>res.json()).then(data=>{
          autosuggestion.classList.remove('d-none');
          for(i=0;i<4; i++){
            autosuggestionList.insertAdjacentHTML('afterbegin', 
            `
            <li class="list-group-item text-start cursor-pointer">
              <a class="stretched-link text-decoration-none text-dark" id="location" onclick="validateAndNext(available=${JSON.stringify(data[i].fields.is_active)}, pincode=${data[i].fields.pincode})">
                ${data[i].fields.pincode}
                <p class="text-muted mb-0">${data[i].fields.location}</p> 
              </a>
            </li>
            `
            )
          }
        }).catch(err=>console.log(err))

      },500)
      
    } else{
      nextBtn.classList.add('d-none');
      message.innerHTML = "";
      autosuggestion.classList.add('d-none');
    }
  })
}
function hideAutoSuggestion(){
  setTimeout(()=>{
    autosuggestion.classList.add('d-none');
  },500);
}

// Show and hide
function showAndHide(tohide, toshow) {
  $('.form-steps').removeClass('step-active')
  if(toshow == 'mainBrandContainer'){
    $('.three').addClass('step-active')
  }else if(toshow == 'main-search-container'){
    $('.one').addClass('step-active')
  }else if(toshow == 'mainDetailsContainer'){
    $('.two').addClass('step-active')
  }else if(toshow == 'mainIssueContainer'){
    $('.four').addClass('step-active')
  }
  document.getElementById(toshow).removeAttribute('hidden');
  const reflow = document.getElementById(toshow).offsetHeight;
  document.getElementById(toshow).classList.add('is-open');

  document.getElementById(tohide).removeEventListener('transitionend', listener(tohide));
}
const listener = (tohide) =>{
  document.getElementById(tohide).setAttribute('hidden', true);
  document.getElementById(tohide).removeEventListener('transitionend', listener)
}

// Filter Brands
function filterBrands() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("brandsearch");
  filter = input.value.toUpperCase();
  ul = document.getElementById("brand-list");
  li = ul.getElementsByTagName("li");
  for (i = 0; i < li.length; i++) {
      a = li[i].dataset.value;
      if (a.toUpperCase().indexOf(filter) > -1) {
          li[i].style.display = "";
      } else {
          li[i].style.display = "none";
      }
  }
}
function saveBrand(brand) {
  brandValue.value = brand;
  serviceClientDetails['brand'] = brand;
  showAndHide('mainBrandContainer', 'mainIssueContainer');
}

// Issue Select
function showNext() {
  issueBtn.classList.remove('d-none');
}

// validate the issue fields and next

function validateIssueAndFinish() {
  if(issueSelect.value == 'please select value'){
    serviceClientDetails['issue'] = issueWrite.value
  } else{
    serviceClientDetails['issue'] = issueSelect.value
  }
  if(issueSelect.value != 'please select value' || issueWrite.value != ''){
    let bookingDetails = new FormData();
    bookingDetails.append('issue', serviceClientDetails['issue'])
    bookingDetails.append('brand', serviceClientDetails['brand'])
    bookingDetails.append('booking', 'bookingdetails')
    bookingDetails.append('name', serviceClientDetails['name'])
    bookingDetails.append('orderId', serviceClientDetails['orderId'])
    fetch('submitbooking/',{
      method: 'POST',
      body: bookingDetails
    }).then(res=>res.json()).then(data=>{
      $('#availabilityModal').modal('hide');
      Swal.fire(
        'Success!',
        'Service order placed!',
        'success'
      );
      showAndHide('mainIssueContainer', 'main-search-container');
      userSubmitBtn.removeAttribute('disabled')
      $('#message').html('');
      $('.locationError').removeClass('d-block');
      regFormReset();
    }).catch(err=>console.log(err))
  } else{
    errorMessage.innerHTML = "Please enter any of the values";
  }
}
if(document.getElementById('mainDetailsForm') != null){
  mainDetailsForm.onsubmit = (e)=>{
    e.preventDefault();
    if(username.value != ''){
      $('.usernameError').removeClass('d-block');
      
    }else{
      $('.usernameError').addClass('d-block');
    }
    if(mobileNo.value != ''){
      $('.mobileError').removeClass('d-block');
    }else{
      $('.mobileError').addClass('d-block');
    }
    if(username.value != '' && mobileNo.value != ''){
      userSubmitBtn.setAttribute('disabled',true)
      serviceClientDetails['name'] = username.value
      serviceClientDetails['mobileno'] = mobileNo.value
      let userData = new FormData(mainDetailsForm);
      userData.append('location', serviceClientDetails['location'])
      userData.append('booking', 'user')
      fetch('submitbooking/', {
        method: 'POST',
        body: userData
      }).then((res)=>res.json()).then(data=>{
        if(data.res == true){
          serviceClientDetails['orderId'] = data.orderId
          showAndHide('mainDetailsContainer', 'mainBrandContainer')
        }
      }).catch(err=>{
        userSubmitBtn.removeAttribute('disabled')
        alert("Sorry something went wrong! Please try again")
        console.log(err)
      });
      
    }
  };
}
/***** Hide Username Error and password error on typing *****/
if(document.getElementById('username') != null){
  username.addEventListener('keyup', ()=>{  
    if(username.value.length >2){
      $('.usernameError').removeClass('d-block');
    }
  })
}
if(document.getElementById('mobileNo') != null){
  mobileNo.addEventListener('keyup', ()=>{  
    if(mobileNo.value.length >2){
      $('.mobileError').removeClass('d-block');
    }
  })
}
/******* Form steps *******/
$('.form-steps').on('click', function(){
  if($(this).hasClass('one')){
    $('.service-form-containers').attr('hidden', true);
    $('.service-form-containers').removeClass('is-open');
    $('.form-steps').removeClass('step-active');
    $(this).addClass('step-active');
      document.getElementById('main-search-container').removeAttribute('hidden');
      const reflow = document.getElementById('main-search-container').offsetHeight;
      document.getElementById('main-search-container').classList.add('is-open');
    
  }
  if($(this).hasClass('two')){
    if(locationSearch.value != ''){
      $('.service-form-containers').attr('hidden', true);
      $('.service-form-containers').removeClass('is-open');
      $('.form-steps').removeClass('step-active');
      $(this).addClass('step-active');
      document.getElementById('mainDetailsContainer').removeAttribute('hidden');
      const reflow = document.getElementById('mainDetailsContainer').offsetHeight;
      document.getElementById('mainDetailsContainer').classList.add('is-open');
    }else{
      $('.locationError').addClass('d-block');
    }
  }
  if($(this).hasClass('three')){
    if(locationSearch.value != '' && username.value != '' && mobileNo.value != ''){
      $('.service-form-containers').attr('hidden', true);
      $('.service-form-containers').removeClass('is-open');
      $('.form-steps').removeClass('step-active');
      $(this).addClass('step-active');
      document.getElementById('mainBrandContainer').removeAttribute('hidden');
      const reflow = document.getElementById('mainBrandContainer').offsetHeight;
      document.getElementById('mainBrandContainer').classList.add('is-open');
    } else{
      if(username.value == ''){
        $('.usernameError').addClass('d-block');
      } else if(mobileNo.value == ''){
        $('.mobileError').addClass('d-block');
      } if(locationSearch.value == ''){
        $('.locationError').addClass('d-block');
      }
    }
  }
  if($(this).hasClass('four')){
    if(locationSearch.value != '' && username.value != '' && mobileNo.value != '' && brandValue.value != ''){
      $('.service-form-containers').attr('hidden', true);
      $('.service-form-containers').removeClass('is-open');
      $('.form-steps').removeClass('step-active');
      $(this).addClass('step-active');
      document.getElementById('mainIssueContainer').removeAttribute('hidden');
      const reflow = document.getElementById('mainIssueContainer').offsetHeight;
      document.getElementById('mainIssueContainer').classList.add('is-open');
    }
  }else{
    if(username.value == ''){
      $('.usernameError').addClass('d-block');
    } else if(mobileNo.value == ''){
      $('.mobileError').addClass('d-block');
    } if(locationSearch.value == ''){
      $('.locationError').addClass('d-block');
    }
  }
});
function regFormReset() {
  document.getElementById('locationSearch').value = '';
  document.getElementById('username').value = '';
  document.getElementById('mobileNo').value = '';
  document.getElementById('issueSelect').selectedIndex = 0;
  serviceClientDetails = {}
}

/**********OTP Verification***************/
/*let OTP;
function sendOTP() {
  let formData = new FormData();
  formData.append('number',document.getElementById('mobileNo').value)

  fetch('sendotp/', {
    method: 'POST',
    body: formData
  }).then(res=>res.json()).then(data=> {
    otpInput.classList.remove('d-none')
    sendOTPBtn.disabled = true;
    OTP=data.otp;
    console.log(OTP);
  }).catch(err=>console.log(err))
  setTimeout(()=>{
    sendOTPBtn.disabled = false;
    sendOTPBtn.innerHTML = 'Resend OTP';
  },3000)
}
otpInput.addEventListener('keyup', ()=>{
  console.log(otpInput.value)
  console.log(typeof(OTP))
  if(otpInput.value.length == 4){
    if(otpInput.value == OTP){
      submitBtn.classList.remove('d-none')
    }else{
      console.log(false)
    }
  }
})*/

// Service booking final booking button
/*submitBtn.addEventListener('click', ()=>{
  if(username.value != ''){
    document.querySelector('.usernameError').classList.remove('d-block');
    
  }else{
    document.querySelector('.usernameError').classList.add('d-block');
  }
  if(email.value != ''){
    document.querySelector('.emailError').classList.remove('d-block');
  }else{
    document.querySelector('.emailError').classList.add('d-block');
  }
  if(username.value != '' && email.value != ''){
    serviceClientDetails['name'] = username.value
    serviceClientDetails['email'] = email.value
    serviceClientDetails['mobileno'] = mobileNo.value

    console.log(serviceClientDetails)
  }
});*/
// Landing page carousel
$('.testimonial-carousel').owlCarousel({
  loop:false,
  margin:10,
  nav:true,
  autoHeight:false,
  responsive:{
      0:{
          items:1
      },
      600:{
          items:2.3
      },
      1000:{
          items:3
      }
  }
})
$('.videos-carousel').owlCarousel({
  loop:false,
  margin:10,
  nav:true,
  autoHeight:false,
  responsive:{
      0:{
          items:1
      },
      600:{
          items:2
      },
      1000:{
          items:4
      }
  }
})

// Navbar Toggle
document.getElementById('menu_btn').addEventListener('click', ()=>{
  $('#mobile-menu').css('width','250px');
  $('.bg-black').fadeIn();
  $('#menu_btn').hide();
})
$('#userMenuBtn').on('click',function(){
  $('.menu-dropdown-user').toggleClass('d-block');
})

document.getElementById('bg-black').addEventListener('click', ()=>{
  $('#mobile-menu').css('width','0px');
  $('.bg-black').fadeOut();
  $('#menu_btn').show();
})

// Date Picker
$('#scheduledate').dateDropper({
  format: 'd-m-Y',
});
$('#timePicker').timeDropper({
  format: 'hh:mm A',
});

// Save Schedule call
schedule_date_form.onsubmit = async (e)=>{
  e.preventDefault();
  schedule_btn.setAttribute('disabled',true)
  fetch('schedulecall/', {
    method: 'POST',
    mode: 'same-origin',
    body: new FormData(schedule_date_form),
  }).then((res)=>res.json()).then((data)=>{
    $('#scheduleCallModal').modal('hide');
    if(data['success'] == 'true'){
      sche_name.value = '';
      scheduledate.value = '';
      timePicker.value = '';
      scheduleMessage.value = '';
      Swal.fire(
        'Success!',
        'We will contact you in your preferred time!',
        'success'
      );
    } else{
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Failed to schedule! Please check your internet connection',
        })
    }
  })

  // if(result['success'] == true){
    
  // } else if(result['success'] == false){
  //   $('#scheduleCallModal').modal('hide')
  //   Swal.fire({
  //     icon: 'error',
  //     title: 'Oops...',
  //     text: 'Failed to schedule! Please check your internet connection',
  //   })
  // }
}

// Fetch name on entering mobile
mobileNo = document.querySelector('#bookingno');
mobileNo.addEventListener('input', function(){  
  if(this.value.length == 10){
    let data = new FormData()
    data.append('mobile', this.value)
    if(this.value.length == 10){
      fetch('repairuser/', {
        method: 'POST',
        body: data
      }).then(res => res.json()).then(data=>{
        if(data.user != null){
          document.querySelector('#bookingname').value = data.user.fields.name;
          $('.username-filled-warning').removeClass('d-none');
        }else{
          document.querySelector('#username').value = '';
          $('.username-filled-warning').addClass('d-none');
        }
      }).catch(err=>console.log(err));
    }
  }
})