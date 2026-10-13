import { AppProvider } from './context/AppContext'

import Toast from './components/Toast'

import Splash from './screens/Splash'
import Login from './screens/Login'
import Signup from './screens/Signup'
import Otp from './screens/Otp'
import MainApp from './screens/MainApp'
import Success from './screens/Success'

import BookModal from './modals/BookModal'
import PayModal from './modals/PayModal'


function AppShell() {
  return (
    <div id="app">

      <Splash />

      <Login />

      <Signup />

      <Otp />

      <MainApp />

      <Success />

      <BookModal />

      <PayModal />

      <Toast />

    </div>
  )
}


export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}