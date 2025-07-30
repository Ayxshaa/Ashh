import { useState } from "react";
const MissionControl = () => {
  const [activeTab, setActiveTab] = useState('about');

  const tabs = [
    { id: 'about', label: 'About Mission', icon: '👨‍🚀' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'contact', label: 'Contact', icon: '📡' }
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'about':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Mission Commander: Ash</h3>
            <p className="text-gray-300 leading-relaxed">
              Welcome to my lunar base! I'm a passionate developer and designer who believes in creating 
              experiences that are out of this world. With expertise spanning full-stack development, 
              UI/UX design, and creative coding, I transform ideas into digital realities.
            </p>
            <p className="text-gray-300 leading-relaxed">
              My mission is to push the boundaries of what's possible in web development, 
              combining cutting-edge technology with stunning visual design.
            </p>
          </div>
        );
      case 'skills':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Technical Arsenal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h4 className="text-purple-400 font-semibold mb-2">Frontend</h4>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• React & Next.js</li>
                  <li>• Three.js & WebGL</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h4 className="text-purple-400 font-semibold mb-2">Backend</h4>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Node.js & Express</li>
                  <li>• Python & Django</li>
                  <li>• PostgreSQL</li>
                  <li>• AWS & Docker</li>
                </ul>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h4 className="text-purple-400 font-semibold mb-2">Design</h4>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• UI/UX Design</li>
                  <li>• Figma & Adobe Creative</li>
                  <li>• Motion Graphics</li>
                  <li>• 3D Modeling</li>
                </ul>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h4 className="text-purple-400 font-semibold mb-2">Tools</h4>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Git & GitHub</li>
                  <li>• Webpack & Vite</li>
                  <li>• Jest & Cypress</li>
                  <li>• CI/CD Pipelines</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Lunar Projects</h3>
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                <h4 className="text-purple-400 font-semibold mb-2">🌌 Cosmic Portfolio</h4>
                <p className="text-gray-300 text-sm mb-2">Interactive 3D portfolio with immersive space theme</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">React</span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">Three.js</span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">WebGL</span>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                <h4 className="text-purple-400 font-semibold mb-2">🚀 Mission Control Dashboard</h4>
                <p className="text-gray-300 text-sm mb-2">Real-time data visualization and control interface</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">React</span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">D3.js</span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">Node.js</span>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                <h4 className="text-purple-400 font-semibold mb-2">🛸 Alien Communication App</h4>
                <p className="text-gray-300 text-sm mb-2">Secure messaging platform with encryption</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">Vue.js</span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">Socket.io</span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">MongoDB</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Establish Contact</h3>
            <p className="text-gray-300 mb-6">
              Ready to embark on a digital journey together? Send a transmission to mission control.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-purple-400">📧</span>
                <span>ash@moonbase.space</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-purple-400">🐙</span>
                <span>github.com/ash-space</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-purple-400">💼</span>
                <span>linkedin.com/in/ash-space</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-purple-400">🐦</span>
                <span>@AshSpaceDev</span>
              </div>
            </div>
            <div className="mt-6">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 flex items-center space-x-2">
                <span>📡</span>
                <span>Send Message</span>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-8 left-8 right-8 z-30 max-w-4xl mx-auto">
      <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-300 flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="p-6 max-h-80 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MissionControl;