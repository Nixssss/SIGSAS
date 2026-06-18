import useAdminViewport from "./useAdminViewport"
import AdminCardDesktop from "./AdminCardDesktop"
import AdminCardMobile from "./AdminCardMobile"

function AdminCard(props) {
  const mobile = useAdminViewport()

  return mobile ? <AdminCardMobile {...props} /> : <AdminCardDesktop {...props} />
}

export default AdminCard
