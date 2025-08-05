
const Home = () => {
 

  return (

    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-6">
  <div className="backdrop-blur-md bg-white/30 border border-white/40 rounded-2xl shadow-2xl p-10 max-w-3xl w-full animate-fade-in">
    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-center mb-4">
      Welcome to Your Customer Portal
    </h1>
    <p className="text-gray-800 text-center text-lg">
      Manage your subscriptions, support tickets, and more — all in one place.
    </p>

    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
        <h2 className="text-xl font-semibold text-indigo-600">💳 Subscriptions</h2>
        <p className="text-gray-600 mt-2 text-sm">View and manage your active plans.</p>
      </div>
      <div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
        <h2 className="text-xl font-semibold text-purple-600">🎫 Support Tickets</h2>
        <p className="text-gray-600 mt-2 text-sm">Raise and track your support issues.</p>
      </div>
      <div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
        <h2 className="text-xl font-semibold text-pink-600">📊 Billing History</h2>
        <p className="text-gray-600 mt-2 text-sm">Access your invoices and payment logs.</p>
      </div>
    </div>
  </div>
</div>

    </>

  );
};

export default Home;
