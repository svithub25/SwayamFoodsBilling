import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Building2, 
  Users, 
  Award,  
  Globe,
  Linkedin,
  Twitter,
  Facebook
} from 'lucide-react';
import svilogo from'../Assets/SV ITHub Logo.jpg'; 

const Contactus = () => {

    return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-24 h-24 rounded-xl flex items-center justify-center">
              <img src={svilogo} alt="S V IT Hub" className="w-full h-full object-contain" />
            </div>  
            <div> 
              <h1 className="text-3xl font-bold text-gray-900"> S V IT Hub</h1>
              <p className="text-lg text-gray-600">Innovating Technology, Empowering Businesses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Primary Contact Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Contact Information Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Address Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Testing Address</h3>
                    <p className="text-gray-600 leading-relaxed">
                      425 Business Center Drive<br />
                      Suite 200<br />        
                      Devkar Panand<br /> 
                      India
                    </p>
                  </div>  
                </div>
              </div>

              {/* Phone Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Numbers</h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Main:</span>
                        <span className="font-medium">9373893048</span>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Fax:</span>
                        <span className="font-medium">(555) 123-4568</span>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Support:</span>
                        <span className="font-medium">(555) 123-4569</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Contacts</h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">General:</span>
                        <span className="font-medium">svithub25@gmail.com</span>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Billing:</span>
                        <span className="font-medium">billing@sterling.com</span>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Support:</span>
                        <span className="font-medium">support@sterling.com</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Online Presence</h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Website:</span>
                        <span className="font-medium">www.sterling.com</span>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Portal:</span>
                        <span className="font-medium">client.sterling.com</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Business Hours</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Office Hours</h4>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span className="font-medium">10:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span className="font-medium text-red-600">Closed</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Support Hours</h4>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span className="font-medium">8:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekend</span>
                      <span className="font-medium">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emergency</span>
                      <span className="font-medium text-green-600">24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Company Info & Stats */}
          <div className="space-y-6">
            
            {/* Company Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About Our Firm</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">150+</p>
                    <p className="text-sm text-gray-600">Team Members</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">25</p>
                    <p className="text-sm text-gray-600">Years Experience</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">500+</p>
                    <p className="text-sm text-gray-600">Happy Clients</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Info */}
            {/* <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Software Registration Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Tax ID:</span>
                  <span className="ml-2 font-medium text-gray-900">12-3456789</span>
                </div>
                <div>
                  <span className="text-gray-500">Business License:</span>
                  <span className="ml-2 font-medium text-gray-900">BL-2024-NY-001</span>
                </div>
                <div>
                  <span className="text-gray-500">Founded:</span>
                  <span className="ml-2 font-medium text-gray-900">1999</span>
                </div>
                <div>
                  <span className="text-gray-500">Entity Type:</span>
                  <span className="ml-2 font-medium text-gray-900">LLC</span>
                </div>
              </div>
            </div> */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Software Registration Details</h3>
  <div className="space-y-3 text-sm">
    <div>
      <span className="text-gray-500">Software Name:</span>
      <span className="ml-2 font-medium text-gray-900">Sterling ERP Suite</span>
    </div>
    <div>
      <span className="text-gray-500">Version:</span>
      <span className="ml-2 font-medium text-gray-900">v2.5.1</span>
    </div>
    <div>
      <span className="text-gray-500">License Key:</span>
      <span className="ml-2 font-medium text-gray-900">XXXX-XXXX-XXXX-XXXX</span>
    </div>
    <div>
      <span className="text-gray-500">Registered To:</span>
      <span className="ml-2 font-medium text-gray-900"> S V IT Hub</span>
    </div>
    <div>
      <span className="text-gray-500">Support Expiry:</span>
      <span className="ml-2 font-medium text-gray-900">31-Dec-2025</span>
    </div>
    <div>
      <span className="text-gray-500">Activation Date:</span>
      <span className="ml-2 font-medium text-gray-900">01-Jan-2024</span>
    </div>
    <div>
      <span className="text-gray-500">License Type:</span>
      <span className="ml-2 font-medium text-gray-900">Enterprise Annual</span>
    </div>
  </div>
</div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <Linkedin className="w-5 h-5 text-blue-600" />
                </a>
                <a href="#" className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center hover:bg-sky-200 transition-colors">
                  <Twitter className="w-5 h-5 text-sky-600" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <Facebook className="w-5 h-5 text-blue-800" />
                </a>
              </div>
            </div>

            {/* Emergency Contact */}
            {/* <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Emergency Contact</h3>
              <p className="text-red-800 font-medium text-lg">(555) 911-HELP</p>
              <p className="text-red-700 text-sm mt-1">Available 24/7 for urgent matters</p>
            </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-gray-600">
              S V IT Hub is your trusted partner in professional services. 
              We're committed to delivering excellence and building lasting relationships with our clients.
            </p>
         
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contactus;