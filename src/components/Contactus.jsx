import React, { useEffect, useState } from 'react';
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
  const [appInfo, setAppInfo] = useState({});

  useEffect(() => {
    window.electronAPI.getAppInfo().then(info => {
      setAppInfo(info);
    }); 
  }, []);

  // Map fields for display
  const appFields = [
    { label: 'Software Name', value: appInfo.productName },
    // { label: 'Internal Name', value: appInfo.name },
    { label: 'Version', value: 'v' + appInfo.version },
    // { label: 'Description', value: appInfo.description },
    // { label: 'Author', value: appInfo.author },
    // { label: 'Company', value: appInfo.company },
    { label: 'License To', value: appInfo.license }
    // { label: 'Copyright', value: appInfo.copyright },
    // { label: 'Homepage', value: appInfo.homepage },
    // { label: 'Repository', value: appInfo.repository },
    // { label: 'Bug Tracker', value: appInfo.bugs },
    // { label: 'Support Email', value: appInfo.supportEmail },
    // { label: 'Support Phone', value: appInfo.supportPhone },
    // { label: 'Release/ Date', value: appInfo.releaseDate },
    // { label: 'Built With', value: Array.isArray(appInfo.builtWith) ? appInfo.builtWith.join(', ') : appInfo.builtWith },
    // { label: 'Changelog', value: appInfo.changelog }
  ];

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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Plot No. 18<br />
                      Sangam Colony<br />        
                      Amrut Nagar Sarnobatwadi<br /> 
                      
                      Kolhapur , India
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
                        <span className="font-medium">8552872020</span>
                      
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Alternate:</span>
                        <span className="font-medium">9373893048</span>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Alternate:</span>
                        <span className="font-medium">9119587288</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg col-span-2 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Contacts</h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center">
                       
                        <span className="font-medium">svithub25@gmail.com</span>
                      </p>
                      {/* <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Billing:</span>
                        <span className="font-medium">billing@sterling.com</span>
                      </p> */}
                      
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Card */}
              {/* <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
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
              </div> */}
            </div>

            {/* Business Hours */}
            {/* <div className="bg-white rounded-2xl p-6 shadow-lg">
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
            </div> */}
          </div>

          {/* Right Column - Software Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Software Information</h3>
              <div className="space-y-3 text-sm">
                {appFields.map(
                  field =>
                    field.value && (
                      <div key={field.label}>
                        <span className="text-gray-500">{field.label}:</span>
                        <span className="ml-2 font-medium text-gray-900 break-all">{field.value}</span>
                      </div>
                    )
                )}
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