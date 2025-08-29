import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Haven
          </h1>
          <p className="text-muted-foreground">
            Manage your finances with ease
          </p>
        </div>

        {/* Balance Overview */}
        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Total Balance
            </h2>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-lime-400/20">
              <span className="text-sm text-lime-400">+12.5%</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground mb-6">
            $24,847.30
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-lime-400 text-black font-medium hover:bg-lime-300 transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
              Send Money
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 text-foreground font-medium hover:bg-white/15 transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 13l-5 5m0 0l-5-5m5 5V6"
                />
              </svg>
              Request Money
            </button>
          </div>
        </div>

        {/* Account Opening Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Open New Account
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Savings Account Card */}
            <div className="glass rounded-3xl p-6 hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-lime-400/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-lime-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Savings Account
                  </h3>
                  <p className="text-lime-400 font-medium">
                    Earn up to 4.5% APY
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Start building your future with our high-yield savings account.
                No minimum balance required, and your money is FDIC insured up
                to $250,000.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <svg
                    className="w-4 h-4 text-lime-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  No monthly fees
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <svg
                    className="w-4 h-4 text-lime-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Mobile & online banking
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <svg
                    className="w-4 h-4 text-lime-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  FDIC insured
                </div>
              </div>

              <Button className="w-full bg-lime-400 text-black hover:bg-lime-300 rounded-2xl py-3 font-medium">
                Open Savings Account
              </Button>
            </div>

            {/* Spending Account Card */}
            <div className="glass rounded-3xl p-6 relative group cursor-pointer overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-600/30 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Spending Account
                  </h3>
                  <p className="text-gray-400 font-medium">
                    For daily transactions
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Perfect for everyday purchases with instant notifications,
                spending insights, and a sleek debit card that works everywhere.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Instant notifications
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Spending insights
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Premium debit card
                </div>
              </div>

              <Button
                className="w-full bg-gray-600 text-white rounded-2xl py-3 font-medium"
                disabled
              >
                Open Spending Account
              </Button>

              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-3xl">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 mx-auto">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-gray-300">
                    {"We're working hard to bring you this feature"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-sm text-foreground font-medium">
                Pay Bills
              </span>
            </button>

            <button className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span className="text-sm text-foreground font-medium">
                Analytics
              </span>
            </button>

            <button className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <span className="text-sm text-foreground font-medium">
                Invest
              </span>
            </button>

            <button className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z"
                  />
                </svg>
              </div>
              <span className="text-sm text-foreground font-medium">
                Support
              </span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Transactions
            </h2>
            <button className="text-sm text-lime-400 hover:text-lime-300 transition-colors">
              View All
            </button>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-400">N</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Netflix Subscription
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Monthly subscription
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">-$15.99</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-400">P</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">PayPal Transfer</p>
                  <p className="text-sm text-muted-foreground">From John Doe</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-lime-400">+$250.00</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-400">S</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Starbucks Coffee
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Food & Beverages
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">-$8.45</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
