export const ModernMinimalistPreview = () => (
  <div className="w-full h-full bg-white p-8 flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-semibold text-gray-900">Dashboard</h3>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
          Settings
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          New Project
        </button>
      </div>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Total Users</div>
        <div className="text-2xl font-bold text-gray-900">2,847</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Revenue</div>
        <div className="text-2xl font-bold text-gray-900">$12,458</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Growth</div>
        <div className="text-2xl font-bold text-gray-900">+23%</div>
      </div>
    </div>

    {/* Form */}
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
      <input
        type="email"
        placeholder="you@example.com"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
)

export const GradientVibrantPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-8 flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-white drop-shadow-lg">Creative Studio</h3>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl text-sm font-semibold border border-white/30 hover:bg-white/30 transition">
          Gallery
        </button>
        <button className="px-4 py-2 bg-white text-purple-600 rounded-xl text-sm font-bold hover:shadow-xl transition">
          Create
        </button>
      </div>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 shadow-xl">
        <div className="text-sm text-white/80 mb-1 font-medium">Projects</div>
        <div className="text-2xl font-black text-white">156</div>
      </div>
      <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl p-4 shadow-xl">
        <div className="text-sm text-white/80 mb-1 font-medium">Likes</div>
        <div className="text-2xl font-black text-white">8.2K</div>
      </div>
      <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl p-4 shadow-xl">
        <div className="text-sm text-white/80 mb-1 font-medium">Views</div>
        <div className="text-2xl font-black text-white">94K</div>
      </div>
    </div>

    {/* Form */}
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
      <label className="block text-sm font-bold text-white mb-2">Join our newsletter</label>
      <input
        type="email"
        placeholder="Enter your email..."
        className="w-full px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </div>
  </div>
)

export const DarkModePreview = () => (
  <div className="w-full h-full bg-gray-900 p-8 flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-white">Console</h3>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition">
          Docs
        </button>
        <button className="px-4 py-2 bg-cyan-500 text-black rounded-lg text-sm font-bold hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/50">
          Deploy
        </button>
      </div>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-cyan-500/50 transition">
        <div className="text-sm text-gray-400 mb-1">Active</div>
        <div className="text-2xl font-bold text-white">42</div>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition">
        <div className="text-sm text-gray-400 mb-1">Requests</div>
        <div className="text-2xl font-bold text-white">1.2M</div>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-green-500/50 transition">
        <div className="text-sm text-gray-400 mb-1">Uptime</div>
        <div className="text-2xl font-bold text-white">99.9%</div>
      </div>
    </div>

    {/* Form */}
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
      <input
        type="text"
        placeholder="sk_live_..."
        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />
    </div>
  </div>
)

export const BrutalistPreview = () => (
  <div className="w-full h-full bg-white p-8 flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h3 className="text-3xl font-black text-black uppercase tracking-tight">PORTFOLIO</h3>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-white text-black rounded-none text-sm font-black border-4 border-black hover:bg-black hover:text-white transition-colors uppercase">
          About
        </button>
        <button className="px-4 py-2 bg-black text-white rounded-none text-sm font-black border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors uppercase">
          Work
        </button>
      </div>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-yellow-300 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-sm font-black mb-1">PROJECTS</div>
        <div className="text-3xl font-black">48</div>
      </div>
      <div className="bg-cyan-300 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-sm font-black mb-1">CLIENTS</div>
        <div className="text-3xl font-black">120</div>
      </div>
      <div className="bg-pink-300 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-sm font-black mb-1">YEARS</div>
        <div className="text-3xl font-black">5</div>
      </div>
    </div>

    {/* Form */}
    <div className="bg-white rounded-none p-6 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <label className="block text-sm font-black mb-2 uppercase">Email</label>
      <input
        type="email"
        placeholder="YOUR@EMAIL.COM"
        className="w-full px-4 py-2 border-4 border-black rounded-none text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-400 uppercase"
      />
    </div>
  </div>
)

export const GlassmorphismPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-8 flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-white drop-shadow-lg">Premium</h3>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-2xl text-sm font-semibold border border-white/40 hover:bg-white/30 transition shadow-lg">
          Explore
        </button>
        <button className="px-4 py-2 bg-white/90 backdrop-blur-lg text-purple-600 rounded-2xl text-sm font-bold hover:bg-white transition shadow-xl">
          Upgrade
        </button>
      </div>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-4 border border-white/40 shadow-xl">
        <div className="text-sm text-white/90 mb-1 font-medium">Members</div>
        <div className="text-2xl font-bold text-white drop-shadow">4,829</div>
      </div>
      <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-4 border border-white/40 shadow-xl">
        <div className="text-sm text-white/90 mb-1 font-medium">Revenue</div>
        <div className="text-2xl font-bold text-white drop-shadow">$89K</div>
      </div>
      <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-4 border border-white/40 shadow-xl">
        <div className="text-sm text-white/90 mb-1 font-medium">Rating</div>
        <div className="text-2xl font-bold text-white drop-shadow">4.9</div>
      </div>
    </div>

    {/* Form */}
    <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-6 border border-white/30 shadow-2xl">
      <label className="block text-sm font-semibold text-white mb-2 drop-shadow">Email address</label>
      <input
        type="email"
        placeholder="you@example.com"
        className="w-full px-4 py-2 bg-white/25 backdrop-blur-xl border border-white/40 rounded-2xl text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-inner"
      />
    </div>
  </div>
)
