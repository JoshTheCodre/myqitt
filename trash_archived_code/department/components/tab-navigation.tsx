interface TabNavigationProps {
  activeTab: "overview" | "detailed"
  onTabChange: (tab: "overview" | "detailed") => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: "overview", label: "Members" },
    { id: "detailed", label: "Roles & Permissions" },
  ] as const

  return (
    <div className="flex w-full py-2 gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="text-sm font-semibold">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
