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
  Facebook,
  ExternalLink
} from 'lucide-react';
import svilogo from'../Assets/SV ITHub Logo.jpg'; 

const Contactus = () => {
  const [appInfo, setAppInfo] = useState({});

  useEffect(() => {
    window.electronAPI.getAppInfo().then(info => {
      setAppInfo(info);
    }); 
  }, []);

  // Helper function to open external links
  const openExternalLink = async (url) => {
    try {
      // Ensure URL has protocol
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        fullUrl = 'https://' + url;
      }
      
      console.log('Opening URL:', fullUrl);
      
      // Check if electronAPI exists
      if (window.electronAPI && window.electronAPI.openExternal) {
        const result = await window.electronAPI.openExternal(fullUrl);
        console.log('Open external result:', result);
        
        if (!result.success) {
          console.error('Failed to open URL:', result.error);
          alert(`Failed to open URL: ${result.error}`);
        }
      } else {
        console.error('electronAPI.openExternal not available');
        // Fallback for development
        window.open(fullUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening external link:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Map fields for display
  const appFields = [
    { label: 'Software Name', value: appInfo.productName },
    { label: 'Version', value: 'v' + appInfo.version },
    { label: 'License To', value: appInfo.license }
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
                      Plot No. 18, Dnyaanaraj<br />
                      Sangam Colony<br />        
                      Amrut Nagar Sarnobatwadi<br /> 
                      Kolhapur, India
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
                        <a 
                          href="tel:8552872020"
                          className="font-medium hover:text-green-600 transition-colors"
                        >
                          8552872020
                        </a>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Alternate:</span>
                        <a 
                          href="tel:9119587288"
                          className="font-medium hover:text-green-600 transition-colors"
                        >
                          9119587288
                        </a>
                      </p>
                      <p className="flex items-center">
                        <span className="text-sm text-gray-500 w-16">Alternate:</span>
                        <a 
                          href="tel:9373893048"
                          className="font-medium hover:text-green-600 transition-colors"
                        >
                          9373893048
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg col-span-1 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Contacts</h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center">
                        <button
                          onClick={() => openExternalLink('mailto:svithub25@gmail.com')}
                          className="font-medium hover:text-purple-600 transition-colors flex items-center gap-1"
                        >
                          svithub25@gmail.com
                          <ExternalLink className="w-3 h-3" />
                        </button>
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
                        <button
                          onClick={() => openExternalLink('www.svithub.co')}
                          className="font-medium hover:text-orange-600 transition-colors flex items-center gap-1"
                        >
                          www.svithub.co
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                <button
                  //onClick={() => openExternalLink('https://linkedin.com/company/svithub')}
                  className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-blue-600" />
                </button>
                <button
                 // onClick={() => openExternalLink('https://twitter.com/svithub')}
                  className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center hover:bg-sky-200 transition-colors"
                  title="Twitter"
                >
                  <Twitter className="w-5 h-5 text-sky-600" />
                </button>
                <button
                  //onClick={() => openExternalLink('https://facebook.com/svithub')}
                  className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-5 h-5 text-blue-800" />
                </button>
              </div>
            </div>
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