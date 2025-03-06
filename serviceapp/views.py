import datetime
from email import message
import json
from math import prod
from operator import ge
import re
import pytz
from unicodedata import name
from django.contrib import messages
from django.http import JsonResponse
from django.http.response import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import csrf_exempt
from api.subcategory.models import SubCategory
from api.maps.models import Maps
from django.contrib.auth.models import User, Group
from django.db.models import Q
from django.core import serializers
from api.brand.models import Brand
from api.bookings.models import Bookings, Issue, Questions, QUESTION_SET_NAME
from api.product.models import Product
from api.spares.models import History, Quality, Spare, SpareProperty, SpareVariety, SpareCosting, Discount, Type
from api.request.models import Request
from .models import Contact, ScheduleCall
import string
import random
from django.conf import settings
from django.contrib.auth.decorators import login_required
from twilio.rest import Client
from django.contrib.auth import authenticate, login, logout
import random
from api.subcategory.models import SubCategory
from api.store.models import Stores
from api.variant.models import Variant
from user.models import CustomUser, UserNotifications
# from api.store.models import Stores
from django.contrib.auth.decorators import permission_required
from .decorators import allowed_users, check_staff_or_superuser
from django.db import DatabaseError, connections, OperationalError
import logging
import os

logger = logging.getLogger(__name__)



@csrf_exempt
def index(request):
    try:
        brands = Brand.objects.all()
        if request.method == 'POST':
            try:
                location_search = request.POST['locationSearch']
                map = Maps.objects.filter(
                    Q(location__icontains=location_search) | 
                    Q(pincode__icontains=location_search)
                )
                location_res = serializers.serialize("json", map)
                return HttpResponse(location_res)
            except Exception as e:
                logger.error(f"Location search error: {str(e)}")
                return JsonResponse({'error': 'Location search unavailable'}, status=503)
        
        context = {
            'brands': brands,
            'db_connected': True
        }
        return render(request, 'serviceapp/index.html', context)
        
    except DatabaseError as e:
        logger.error(f"Database error in index: {str(e)}")
        context = {
            'brands': [],
            'db_connected': False
        }
        return render(request, 'serviceapp/index.html', context)
    
@csrf_exempt
def scheduleCall(request):
    if request.method == 'POST':

        schedule_name = request.POST['schedule_name']
        date = request.POST['schedule_date']
        time = request.POST['schedule_time']
        message = request.POST['message']
        try:
            new_schedule = ScheduleCall.objects.create(name=schedule_name,date=date,time=time,message=message)
            new_schedule.save()

            return JsonResponse({'success': 'true','message': "Successfully scheduled! We'll contact you in your preferred time."}, safe=True)
        except:
            return JsonResponse({'success': 'false','message': "Failed to schedule! Please check your internet connection"}, safe=True)
    

@csrf_exempt
def getLocationAvailability(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        location = data['location']
        mapLocationObject = Maps.objects.filter(Q(pincode__icontains=location) | Q(location__icontains=location))
        if len(mapLocationObject) == 0:
            return JsonResponse({'is_active': False})
        else:
            context = serializers.serialize('json', mapLocationObject)
            return HttpResponse(context)

@csrf_exempt
def sendOTP(request):
    if request.method == 'POST':
        number = request.POST['number']
        acc_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN

        client = Client(acc_sid, auth_token)
        otp = random.randint(1000, 9999)
        message = client.messages.create(  
                                  messaging_service_sid='MG2682432dad74dec74ae45c0fb3b4e5c1', 
                                  body=f'Your OTP for Finetune Service is {otp}',      
                                  to=f'+91{number}' 
                              )

        return JsonResponse({'otp': otp}, safe=True)

def bookings(request):
    if request.method == 'POST':
        name = request.POST['name']
        mobile = request.POST['mobile']

        
@csrf_exempt
def submitBooking(request):
    if request.method == 'POST':
        condition = request.POST['booking']
        if condition == 'user':
            orderId = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(8))
            if Bookings.objects.filter(orderId = orderId).exists():
                orderId = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(8))
            name = request.POST['name']
            mobile = request.POST['mobile']
            location = request.POST['location']
            booking = Bookings.objects.create(orderId=orderId, name=name, mobile=mobile, pincode=location)
            booking.save()
            return JsonResponse({'res':True, 'orderId': orderId}, safe=True)

        # elif condition == 'bookingdetails':
        #     get_booking = get_object_or_404(Bookings, orderId=request.POST['orderId'])
        #     get_brand = get_object_or_404(Brand, name=request.POST['brand'])
        #     issue = request.POST['issue']
        #     BookingDetails.objects.create(booking_for=get_booking, brands=get_brand, issue=issue)
            
        #     return JsonResponse({'res':True}, safe=True)

@csrf_exempt
def spares(request):
    get_spares = SpareVariety.objects.all()
    context = serializers.serialize('json', get_spares)
    return HttpResponse(context)

@login_required(login_url='/loginpage/')
def noAccessPage(request):
    return render(request, 'serviceapp/auth/no_perm.html')

@login_required(login_url='/loginpage/')
def dashboard(request):
    brand_count = Brand.objects.all().count()
    product_count = Product.objects.all().count()

    context = {
        'brand_count': brand_count,
        'product_count': product_count,
    }
    return render(request, 'serviceapp/auth/dashboard.html', context)

@login_required(login_url='/loginpage/')
def priceCheck(request):
    spare_costing = SpareCosting.objects.all()
    discounts = Discount.objects.all()
    subcategories = SubCategory.objects.all()
    context = {
        "spare_costing": spare_costing,
        "discounts": discounts,
        "subcategories": subcategories
    }
    return render(request, 'serviceapp/auth/price_check.html', context)

@csrf_exempt
def checkProductExistance(request):
    if request.method == 'POST':
        product = request.POST['product']
        if Product.objects.filter(name = product).exists():
            return JsonResponse({'res': True}, safe=True)
        else:
            return JsonResponse({'res': False}, safe=True)

@csrf_exempt
def newSpare(request):
    if request.method == 'POST':
        product = request.POST['product']
        model = request.POST['model']
        spare_name = request.POST['spare_name']
        quality = request.POST['quality']
        purchase_price = request.POST['purchase_price']
        spare_costing = request.POST['spare_costing']
        discount = request.POST['discount']
        subcategory = request.POST['subcategory']
        purchase_price_number = int(purchase_price)

        get_spare_costing = get_object_or_404(SpareCosting, spare_costing_name=spare_costing)
        get_discount = get_object_or_404(Discount,discount_name=discount)

        if subcategory != '':
            get_subcategory = get_object_or_404(SubCategory, name=subcategory)
            new_product = Product.objects.create(subcategory = get_subcategory, name=product)
            new_product.save()

            new_variant = Variant.objects.create(product=new_product, variant_name=model)
            new_variant.save()

            new_spare = Spare.objects.create(varient =new_variant, name=spare_name)
            new_spare.save()

           

            new_spare_variety = SpareVariety.objects.create(spare=new_spare, quality=quality,purchase_price=purchase_price_number,spare_costing=get_spare_costing,spare_discount=get_discount)
            new_spare_variety.save()

        else:
            if Variant.objects.filter(variant_name = model).exists():
                get_spare = Spare.objects.filter(Q(varient__variant_name = model) & Q(name=spare_name)).first()
            else:
                get_product = Product.objects.get(name=product)
                new_variant = Variant.objects.create(product=get_product, variant_name = model)
                new_variant.save()

                new_spare = Spare.objects.create(varient =new_variant, name=spare_name)
                new_spare.save()

                get_spare = new_spare

            new_spare_variety = SpareVariety.objects.create(spare=get_spare, quality=quality,purchase_price=purchase_price_number,spare_costing=get_spare_costing,spare_discount=get_discount)
            new_spare_variety.save()

  

        return JsonResponse({'res':True}, safe=True)

# Login user
def userLogin(request):
    # Redirect if user already logged in
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        if not username or not password:
            messages.error(request, 'Please provide both username and password')
            return redirect('loginpage')
            
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next', 'dashboard')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password')
            return redirect('loginpage')
    
    # GET request - redirect to login page
    return redirect('loginpage')

def userLogout(request):
    logout(request)
    return redirect('index')

def about(request):
    return render(request, 'serviceapp/about.html')
    
def locate(request):
    return render(request, 'serviceapp/locate.html')

def terms(request):
    return render(request, 'serviceapp/terms.html')

def contact(request):
    if request.method == "POST":
        name = request.POST['name']
        mobile = request.POST['mobile']
        message = request.POST['message']

        try:
            save_contact = Contact.objects.create(name=name, mobile_no=mobile, message=message)
            save_contact.save()
            messages.success(request, 'Successfully saved your message! Will contact you soon!')
            return  redirect('contact')

        except:
            messages.error(request, 'Something went wrong! Please check your Internet connection.')
            return redirect('contact')
            
    return render(request, 'serviceapp/contact.html')

@csrf_exempt
def getRepairUser(request):
    if request.method == 'POST':
        mobile_no = request.POST['mobile']
        filter_bookings = Bookings.objects.filter(mobile = mobile_no)
        if filter_bookings.exists():

            context = {
                'user': serializers.serialize('python', filter_bookings.order_by('-booking_date'))[0]
            }
        else:
            context = {
                'user': None
            }
        return JsonResponse(context, safe=True)

@login_required(login_url='/loginpage/')
def BookingsView(request):
    bookings = Bookings.objects.all().order_by('-date_created')[:10]
    issues = Issue.objects.all()
    context = {
        'bookings': bookings,
        'issues': issues,
    }
    return render(request, 'serviceapp/auth/bookingsView.html',context)

def removeSpace(string):
    return string.replace(" ", "")

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def productManagement(request):
    return render(request, 'serviceapp/auth/product_manager.html')

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def priceMaintanence(request):
    requests = Request.objects.filter(is_completed = False).order_by('-date_created')

    context = {
        'requests': requests
    } 
    return render(request, 'serviceapp/auth/pricemaintanence.html',context)

def loginPage(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'serviceapp/auth/login_page.html')

@login_required(login_url='/loginpage/')
@check_staff_or_superuser
def addUser(request):
    if request.user.is_superuser:
        all_users = CustomUser.objects.filter(is_staff=False).order_by('-date_joined')
        context = {
            'all_users': all_users
        }
        return render(request, 'serviceapp/auth/add_user.html', context)
    else:
        return redirect('noaccesspage')

def register(request):
    if request.method == 'POST':
        mobile = request.POST['mobile']
        email = request.POST.get('email', None)
        password = request.POST['password']
        is_admin = request.POST.get('is_admin', False)
        is_staff = request.POST.get('is_staff', False)
        is_manager = request.POST.get('is_manager', False)
        q = request.GET.get('q', None)

        admin_check = True if is_admin == 'on' else False
        staff_check = True if is_staff == 'on' else False
        manager_check = True if is_manager == 'on' else False

        if not CustomUser.objects.filter(phone=mobile).exists():
            if email:
                user = CustomUser(phone=mobile, email=email)
            else:
                user = CustomUser(phone=mobile)

            user.set_password(password)
            
            try:
                user.save()
                if admin_check:
                    user.groups.add(Group.objects.get(name__iexact='admin'))
                if staff_check:
                    user.groups.add(Group.objects.get(name__iexact='staff'))
                if manager_check:
                    user.groups.add(Group.objects.get(name__iexact='manager'))

                if q == 'add_user':
                    messages.success(request, 'Successfully added the user!')
                    return redirect('adduser')
                else:
                    user = authenticate(request, username=mobile, password=password)
                    login(request, user)
                    return redirect('dashboard')
            except:
                return redirect('%s?next=%s' % (settings.LOGIN_URL, request.path))
        else:
            messages.error(request, 'Already this mobile number registered please login!')
            if q == 'add_user':
                return redirect('adduser')
            else:
                return redirect('loginpage')
    
    return render(request, 'serviceapp/auth/register.html')

@csrf_exempt
def request(request):
    data = json.loads(request.body)
    product = data[0]['product']
    brand = data[0]['brand']
    issue = data[0]['issue']

    # Twilio Cred
    acc_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN

    client = Client(acc_sid, auth_token)
    message = f'New request from {request.user}: {brand}{product} - {issue}'
    
    if Product.objects.filter(name__iexact = data[0]['product'], brand__name__iexact = brand).exists():
        product = Product.objects.get(name__iexact = data[0]['product'], brand__name__iexact = brand)
        try:
            new_request = Request.objects.create(user=request.user,brand=data[0]['brand'], product=product, issue = data[0]['issue'])
            new_request.save()

            client.messages.create(body=message,
                       from_='whatsapp:+14155238886',
                       to=f'whatsapp:+919791151863')
            
            return JsonResponse({"success": 'true'})
        except:
            return JsonResponse({"success": 'false'})
    elif Product.objects.filter(model_no__iexact = data[0]['product']).exists():
        product = Product.objects.get(model_no__iexact=data[0]['product'])
        try:
            new_request = Request.objects.create(user=request.user,brand=data[0]['brand'], model_no=product, issue = data[0]['issue'])
            new_request.save()

            client.messages.create(body=message,
                       from_='whatsapp:+14155238886',
                       to=f'whatsapp:+919791151863')
            return JsonResponse({"success": 'true'})
        except:
            return JsonResponse({"success": 'false'})
    else:
        product = data[0]['product']
        try:
            new_request = Request.objects.create(user=request.user,brand=data[0]['brand'], model=product, model_no=product, issue = data[0]['issue'])
            new_request.save()

            client.messages.create(body=message,
                        from_='whatsapp:+14155238886',
                        to=f'whatsapp:+919791151863')
            return JsonResponse({"success": 'true'})
        except:
            return JsonResponse({"success": 'false'})

@csrf_exempt
def savePrice(request):
    data = json.loads(request.body)
    id=request.GET.get('id', None)
    is_edit=request.GET.get('edit', None)
    brand = data[0]['brand']
    model = data[0]['model']
    modelno = data[0]['modelno']
    spare = data[0]['spare']
    username = data[0]['user']
    type = data[0]['display_type']
    getuser = get_object_or_404(CustomUser, phone=username)
    
    # Twilio Cred
    acc_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN

    client = Client(acc_sid, auth_token)

    # Editing the Brand name
    if Brand.objects.filter(name__iexact=brand).exists():
        get_brand = get_object_or_404(Brand, name__iexact=brand)
    else:
        if is_edit:
            brand_id = data[0]['brand_id']
            get_brand = get_object_or_404(Brand, id=brand_id)
            get_brand.name = brand
            get_brand.save()
        else:
            get_brand = Brand.objects.create(name=brand)
            get_brand.save()
    
    # Editing the product name
    if is_edit:
        product_id = data[0]['model_id']
        get_product = get_object_or_404(Product, id=product_id)
        get_product.name = model
        get_product.model_no = modelno
        get_product.save()

    # Predefining the subcategory as Mobile
    subcategory = SubCategory.objects.get(name__iexact = 'mobile')

    if Spare.objects.filter(Q(product__model_no__iexact = modelno) & Q(name__iexact = spare)).exists():
        get_spare = Spare.objects.get(product__model_no__iexact = modelno, name__iexact = spare)
        # try:
        quality_price = {}
        for quality_set in  data[0]['quality_set'][0]:
            quality_price[quality_set['quality']] = quality_set['price']
            if get_spare.spare_variety.filter(quality__quality__iexact = quality_set['quality']):
                check = get_spare.spare_variety.filter(quality__quality__iexact = quality_set['quality'])
                get_variety = get_spare.spare_variety.get(quality__quality__iexact = quality_set['quality'])
                
                # Saving History
                history = History.objects.create(spare=get_spare, quality=get_variety.quality,purchase_price=get_variety.purchase_price,is_available=get_variety.is_available)
                history.save()

                get_variety.purchase_price = int(quality_set['price'])
                get_variety.save()
            else:
                if Quality.objects.filter(quality__iexact=quality_set['quality']):
                    new_quality = Quality.objects.get(quality__iexact=quality_set['quality'])
                else:
                    new_quality = Quality.objects.create(quality=quality_set['quality'])
                    new_quality.save()
                new_spare_variety = SpareVariety.objects.create(quality=new_quality, purchase_price=int(quality_set['price']), is_available=True)
                new_spare_variety.save()
                add_spare_variety = get_spare.spare_variety.add(new_spare_variety)

                # Saving History
                history = History.objects.create(spare=get_spare, quality=new_quality,purchase_price=new_spare_variety.purchase_price ,is_available=new_spare_variety.is_available)
                history.save()

        # checking type exists if spare type is display
        if spare == 'Display' or spare == 'display':
            if Type.objects.filter(type__iexact = type).exists():
                spare_type = Type.objects.get(type__iexact = type)
            else:
                spare_type = Type.objects.create(type=type)
                spare_type.save()
        
        get_spare.type = spare_type
        get_spare.save()

        if id!='' and id!=None:
            req = Request.objects.get(id=id)
            req.is_completed = True
            req.save()

        # Saving Notification
        notify_heading = f"Your request Answer"
        notify_content = f"Price updated for {brand}{model}!"
        
        new_notification = UserNotifications.objects.create(user=getuser,notification_heading=notify_heading, notification_content=notify_content)
        new_notification.save()
        message = f'Your Request for {brand}{model} is {quality_price}'
        client.messages.create(body=message,
                       from_='whatsapp:+14155238886',
                       to=f'whatsapp:+91{getuser.phone}')
        # except:
        #     raise Exception("Sorry, Something went wrong!")
            
            
    else:
        if not Product.objects.filter(model_no__iexact = modelno).exists():
            product_id = '%s%s'%(removeSpace(get_brand.name),removeSpace(model))
            product = Product.objects.create(subcategory = subcategory,product_id=product_id, brand=get_brand, name=model, model_no=modelno)
            product.save()
        else:
            product = Product.objects.get(model_no__iexact = modelno)

        # checking type exists if spare type is display
        if spare == 'Display' or spare == 'display':
            if Type.objects.filter(type__iexact = type).exists():
                spare_type = Type.objects.get(type__iexact = type)
            else:
                spare_type = Type.objects.create(type=type)
                spare_type.save()

        new_spare = Spare.objects.create(product=product, name=spare, type=spare_type)
        quality_price = {}
        # try:
        for quality_set in  data[0]['quality_set'][0]:
            quality_price[quality_set['quality']] = quality_set['price']

            if Quality.objects.filter(quality__iexact=quality_set['quality']):
                new_quality = Quality.objects.get(quality__iexact=quality_set['quality'])
            else:
                new_quality = Quality.objects.create(quality=quality_set['quality'])
                
            new_spare_variety = SpareVariety.objects.create(quality=new_quality, purchase_price=int(quality_set['price']), is_available=True)
            new_spare_variety.save()
            new_spare.spare_variety.add(new_spare_variety)

            # Saving History
            history = History.objects.create(spare=new_spare, quality=new_quality,purchase_price=new_spare_variety.purchase_price ,is_available=new_spare_variety.is_available)
            history.save()
        
        new_spare.save()

        req = Request.objects.get(id=id)
        req.is_completed = True
        req.save()
        
        notify_heading = f"Your request Answer"
        notify_content = f"Price added for {brand}{model}!"
        
        new_notification = UserNotifications.objects.create(user=getuser,notification_heading=notify_heading, notification_content=notify_content)
        new_notification.save()
        message = f'Your Request for {brand}{model} is {quality_price}'
        client.messages.create(body=message,
                       from_='whatsapp:+14155238886',
                       to=f'whatsapp:+91{getuser.phone}')
        # except:
        #     raise Exception("Sorry, Something went wrong!")
            
    return JsonResponse({'success': 'true'})

# Updated Save price or edit
@csrf_exempt
def savePriceUpdate(request):
    data = json.loads(request.body)
    id=request.GET.get('id', None)
    is_edit=request.GET.get('edit', None)
    brand = data[0]['brand']
    model = data[0]['model']
    modelno = data[0]['modelno']
    username = data[0]['user']
    type = data[0]['display_type']
    battery = data[1]['battery']
    release_year = data[2]['release_year']
    charger_type = data[2]['charger_type']
    getuser = get_object_or_404(CustomUser, phone=username)

    # Edit or creating new display spare
    quality_price = {}

    # Predefining the subcategory as Mobile
    subcategory = SubCategory.objects.get(name__iexact = 'mobile')

    # Editing the Brand name
    if Brand.objects.filter(name__iexact=brand).exists():
        get_brand = get_object_or_404(Brand, name__iexact=brand)
    else:
        if is_edit:
            brand_id = data[0]['brand_id']
            get_brand = get_object_or_404(Brand, id=brand_id)
            get_brand.name = brand
            get_brand.save()
        else:
            get_brand = Brand.objects.create(name=brand)
            get_brand.save()
    
    # Editing the product name
    if is_edit:
        product_id = data[0]['model_id']
        get_product = get_object_or_404(Product, id=product_id)
        get_product.name = model
        get_product.model_no = modelno
        get_product.release_year = release_year
        get_product.save()

    # check spare availability
        # if spare available, no product check
        # if spare not available, check product availability

    try:
        # display
        spare_get_create = Spare.objects.get(product__model_no__iexact = modelno, name__iexact = 'Display')

    except Spare.DoesNotExist:
        # check product availability
        product_id = '%s%s'%(removeSpace(get_brand.name),removeSpace(model))
        if not Product.objects.filter(Q(model_no__iexact = modelno) | Q(product_id__iexact = product_id)).exists():
            if release_year != '':
                product = Product.objects.create(subcategory = subcategory,product_id=product_id, brand=get_brand, name=model, model_no=modelno, release_year=int(release_year))
                product.save()
            else:
                product = Product.objects.create(subcategory = subcategory,product_id=product_id, brand=get_brand, name=model, model_no=modelno)
                product.save()
        else:
            product = Product.objects.get(product_id__iexact = product_id)
            product.name = model
            product.model_no = modelno
            product.release_year = release_year
            product.save()

        # Creating sparetype if not available (LED, LCD)
        spare_type, created = Type.objects.get_or_create(type__iexact = type)

        spare_get_create = Spare.objects.create(product=product, name='Display', type=spare_type)
        spare_get_create.save()

    # Battery
    # Checking property
    if battery != '':
        if SpareProperty.objects.filter(property_value = int(battery)).exists():
            new_get_prop = SpareProperty.objects.get(property_value=int(battery))
        else:
            new_get_prop = SpareProperty.objects.create(property_value=int(battery),property_unit="MAH")
            new_get_prop.save()

        purchase_price = 0.25* int(battery) # base price & not purchase price
        retail_price = purchase_price + 200
        
        new_get_prop.property = new_get_prop
        new_get_prop.purchase_price = purchase_price
        new_get_prop.retail_price = retail_price
        new_get_prop.save()

        try:
            # Battery
            battery_spare_get_create = Spare.objects.get(product__model_no__iexact = modelno, name__iexact = 'Battery')
            get_spare_variety = battery_spare_get_create.spare_variety.all().first()

            get_spare_variety.property = new_get_prop
            get_spare_variety.purchase_price = purchase_price
            get_spare_variety.retail_price = retail_price
            get_spare_variety.save()

        except Spare.DoesNotExist:
            product = Product.objects.get(model_no__iexact = modelno)
            battery_spare_get_create = Spare.objects.create(product=product, name='Battery')
            battery_spare_get_create.save()
        
            new_spare_variety = SpareVariety.objects.create(property = new_get_prop, purchase_price=purchase_price, retail_price=retail_price)
            battery_spare_get_create.spare_variety.add(new_spare_variety)
            new_spare_variety.save()
    
    try:
        # display
        charger_get_create = Spare.objects.get(product__model_no__iexact = modelno, name__iexact = 'Charger port')
        charger_spare_variety = charger_get_create.spare_variety.all().first()

        charger_spare_variety.variety_name = charger_type
        charger_spare_variety.save()
    except:
        product = Product.objects.get(model_no__iexact = modelno)
        charger_spare_get_create = Spare.objects.create(product=product, name='Charger port')
        charger_spare_get_create.save()
    
        new_charger_spare_variety = SpareVariety.objects.create(variety_name=charger_type)
        charger_spare_get_create.spare_variety.add(new_charger_spare_variety)
        new_charger_spare_variety.save()

    quality_price = {}

    # try:
    for quality_set in  data[0]['quality_set'][0]:
        quality_price[quality_set['quality']] = quality_set['price']

        if spare_get_create.spare_variety.filter(quality__quality__iexact = quality_set['quality']):
            check = spare_get_create.spare_variety.filter(quality__quality__iexact = quality_set['quality'])
            get_variety = spare_get_create.spare_variety.get(quality__quality__iexact = quality_set['quality'])
            
            # Saving History
            history = History.objects.create(spare=spare_get_create, quality=get_variety.quality,purchase_price=get_variety.purchase_price,is_available=get_variety.is_available)
            history.save()

            get_variety.purchase_price = int(quality_set['price'])
            get_variety.save()

        else:
            if Quality.objects.filter(quality__iexact=quality_set['quality']):
                new_quality = Quality.objects.get(quality__iexact=quality_set['quality'])
            else:
                new_quality = Quality.objects.create(quality=quality_set['quality'])
                new_quality.save()
            new_spare_variety = SpareVariety.objects.create(quality=new_quality, purchase_price=int(quality_set['price']), is_available=True)
            new_spare_variety.save()
            add_spare_variety = spare_get_create.spare_variety.add(new_spare_variety)

            # Saving History
            history = History.objects.create(spare=spare_get_create, quality=new_quality,purchase_price=new_spare_variety.purchase_price ,is_available=new_spare_variety.is_available)
            history.save()
    
    if id!='' and id!=None:
        req = Request.objects.get(id=id)
        req.is_completed = True
        req.save()

        # Saving Notification
        notify_heading = f"Your request Answer"
        notify_content = f"Price updated for {brand}{model}!"
        
        new_notification = UserNotifications.objects.create(user=getuser,notification_heading=notify_heading, notification_content=notify_content)
        new_notification.save()

    return JsonResponse({'success': 'true'})


@csrf_exempt
def closeRequest(request, id):
    # Twilio Cred
    acc_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN

    client = Client(acc_sid, auth_token)

    if request.method == 'POST':
        get_request = get_object_or_404(Request, id = id)
        data = json.loads(request.body)
        note = data[0]['message']
        user = data[0]['user']

        try:
            get_request.is_completed = True
            get_request.note = note
            get_request.save()
            
            client.messages.create(body=note,
                       from_='whatsapp:+14155238886',
                       to=f'whatsapp:+91{user}')
                       
            return JsonResponse({'success': 'true'})
        except:
            return JsonResponse({'success': 'false'})

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def allBookings(request):
    get_bookings = Bookings.objects.all()
    issues = Issue.objects.all()
    context = {
        'bookings': get_bookings,
        'issues': issues
    }
    return render(request, 'serviceapp/auth/all_bookings.html',context)

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def stores(request):
    stores = Stores.objects.all()
    context = {
        'stores': stores
    }
    return render(request, 'serviceapp/auth/store.html', context)

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def reports(request):
    now = datetime.datetime.now(pytz.utc)
    one_month = datetime.datetime(now.year, now.month, 1)
    stores = Stores.objects.all()

    total_booking_count = Bookings.objects.filter(enq_or_cus = 'CUS').count()
    monthly_booking_count = Bookings.objects.filter(enq_or_cus = 'CUS', date_created__lte = one_month).count()
    total_enquiry_count = Bookings.objects.filter(enq_or_cus = 'ENQ').count()
    monthly_enquiry_count = Bookings.objects.filter(enq_or_cus = 'ENQ', date_created__lte = one_month).count()
    
    context = {
        'total_booking_count': total_booking_count,
        'monthly_booking_count': monthly_booking_count,
        'total_enquiry_count':total_enquiry_count,
        'monthly_enquiry_count': monthly_enquiry_count,
        'stores': stores,
    }
    return render(request, 'serviceapp/auth/reports.html', context)

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def orders(request):
    get_bookings = Bookings.objects.all()
    issues = Issue.objects.all()
    context = {
        'bookings': get_bookings,
        'issues': issues
    }
    return render(request, 'serviceapp/auth/orders.html', context)

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def tasks(request):
    get_bookings = Bookings.objects.all()
    issues = Issue.objects.all()
    context = {
        'bookings': get_bookings,
        'issues': issues
    }
    return render(request, 'serviceapp/auth/tasks.html', context)

@login_required(login_url='/loginpage/')
@allowed_users(allowed_rules=['Admin'])
def questions(request):
    questions = Questions.objects.all()
    question_set = []
    for x in QUESTION_SET_NAME:
        question_set.append({'question_set': x[1], 'qs': x[0]})
    
    context = {
        'questions': questions,
        'question_set': question_set
    }
    return render(request, 'serviceapp/auth/questions.html', context)

def debug_db(request):
    if not request.user.is_superuser:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    try:
        c = connections['default'].cursor()
        c.execute('SELECT 1;')
        c.close()
        return JsonResponse({
            'status': 'connected',
            'environment': os.environ.get('VERCEL_ENV', 'unknown'),
            'database_host': os.environ.get('POSTGRES_HOST', 'unknown'),
            'database_name': os.environ.get('POSTGRES_DATABASE', 'unknown')
        })
    except OperationalError as e:
        return JsonResponse({
            'status': 'error',
            'error': str(e),
            'environment': os.environ.get('VERCEL_ENV', 'unknown'),
            'database_host': os.environ.get('POSTGRES_HOST', 'unknown'),
            'database_name': os.environ.get('POSTGRES_DATABASE', 'unknown')
        }, status=500)
