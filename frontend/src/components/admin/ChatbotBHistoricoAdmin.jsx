import useAdminViewport from "./useAdminViewport"
import ChatbotBHistoricoAdminDesktop from "./ChatbotBHistoricoAdminDesktop"
import ChatbotBHistoricoAdminMobile from "./ChatbotBHistoricoAdminMobile"

function ChatbotBHistoricoAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <ChatbotBHistoricoAdminMobile {...props} /> : <ChatbotBHistoricoAdminDesktop {...props} />
}

export default ChatbotBHistoricoAdmin
