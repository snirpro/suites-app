import AuthGuard from './components/AuthGuard'
import LogoutButton from './components/LogoutButton'
import SuitesManager from './components/SuitesManager'

export default function Home() {
  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">ניהול סוויטות</h1>
          <LogoutButton />
        </div>

        <SuitesManager />
      </div>
    </AuthGuard>
  )
}
