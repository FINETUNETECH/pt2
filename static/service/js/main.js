// Get cookie for CSRF token
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

// Global state for service client details
const serviceClientDetails = {};

// DOM element helpers
const getElement = (id) => document.getElementById(id);
const getElements = (selector) => document.querySelectorAll(selector);

// Maps API Connection
const initializeMapForm = () => {
  const mapForm = getElement('mapForm');
  if (!mapForm) return;

  mapForm.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(mapForm);
      try {
          const response = await fetch('/', {
              method: 'POST',
              mode: 'same-origin',
              body: JSON.stringify(formData),
          });
          const data = await response.json();
          console.log(data);
      } catch (err) {
          console.error(err);
      }
  };
};

// Getting location availability
const validateAndNext = async (available, pincode = null, discover = false) => {
  const locationSearch = getElement('locationSearch');
  if (!locationSearch) return;

  if (discover) {
      try {
          const csrf = getCookie('csrftoken');
          const response = await fetch('validateavailability/', {
              method: 'POST',
              body: JSON.stringify({ location: locationSearch.value }),
              headers: { 'X-CSRFToken': csrf }
          });
          const data = await response.json();
          
          if (data.is_active === false) {
              availableCall(false);
          } else if (data[0]?.fields.is_active === true) {
              serviceClientDetails.location = data[0].fields.pincode;
              availableCall(true);
          } else {
              availableCall(false);
          }
      } catch (error) {
          console.error('Validation failed:', error);
          availableCall(false);
      }
  } else {
      locationSearch.value = pincode;
      serviceClientDetails.location = pincode;
      availableCall(available);
  }
};

// Handle availability response
function availableCall(available) {
  const message = getElement('message');
  const nextBtn = getElement('nextBtn');
  
  if (available) {
      $('.locationError').removeClass('d-block');
      message.classList.remove('text-danger');
      message.classList.add('text-success');
      message.innerHTML = "Yay! We are available at your location";
      nextBtn?.classList.remove('d-none');
  } else {
      message.classList.remove('text-success');
      message.classList.add('text-danger');
      message.innerHTML = "Sorry currently we are not available in your location";
      nextBtn?.classList.add('d-none');
  }
}

// Autocomplete location
const initializeLocationSearch = () => {
  const locationSearch = getElement('locationSearch');
  if (!locationSearch || !locationSearch.value) return;

  let timeout = null;
  locationSearch.addEventListener('input', (event) => {
      clearTimeout(timeout);
      getElement('autosuggestionList').innerHTML = '';
      
      if (locationSearch.value.length >= 2) {
          const formData = new FormData();
          formData.append('locationSearch', locationSearch.value);
          
          timeout = setTimeout(async () => {
              try {
                  const response = await fetch('/', {
                      method: 'POST',
                      mode: 'same-origin',
                      body: formData,
                  });
                  const data = await response.json();
                  renderLocationSuggestions(data);
              } catch (err) {
                  console.error(err);
              }
          }, 500);
      } else {
          getElement('nextBtn')?.classList.add('d-none');
          getElement('message').innerHTML = '';
          getElement('autosuggestion')?.classList.add('d-none');
      }
  });
};

// Show and hide containers
function showAndHide(tohide, toshow) {
  $('.form-steps').removeClass('step-active');
  
  // Update step indicators
  const stepMapping = {
      'mainBrandContainer': 'three',
      'main-search-container': 'one',
      'mainDetailsContainer': 'two',
      'mainIssueContainer': 'four'
  };
  
  if (stepMapping[toshow]) {
      $(`.${stepMapping[toshow]}`).addClass('step-active');
  }
  
  const showElement = getElement(toshow);
  const hideElement = getElement(tohide);
  
  if (showElement && hideElement) {
      showElement.removeAttribute('hidden');
      const reflow = showElement.offsetHeight;
      showElement.classList.add('is-open');
      
      hideElement.removeEventListener('transitionend', () => listener(tohide));
  }
}

// Form steps and validation
const initializeFormSteps = () => {
  $('.form-steps').on('click', function() {
      const locationSearch = getElement('locationSearch');
      const username = getElement('username');
      const mobileNo = getElement('mobileNo');
      const brandValue = getElement('brandValue');
      
      // Handle different form steps
      if ($(this).hasClass('one')) {
          handleStepOne();
      } else if ($(this).hasClass('two')) {
          handleStepTwo(locationSearch);
      } else if ($(this).hasClass('three')) {
          handleStepThree(locationSearch, username, mobileNo);
      } else if ($(this).hasClass('four')) {
          handleStepFour(locationSearch, username, mobileNo, brandValue);
      }
  });
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeMapForm();
  initializeLocationSearch();
  initializeFormSteps();
});

// Export for module usage
export {
  serviceClientDetails,
  validateAndNext,
  showAndHide,
  availableCall
};