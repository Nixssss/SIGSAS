import useAdminViewport from "./useAdminViewport"
import SugestoesMelhoriasAdminDesktop from "./SugestoesMelhoriasAdminDesktop"
import SugestoesMelhoriasAdminMobile from "./SugestoesMelhoriasAdminMobile"

function SugestoesMelhoriasAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <SugestoesMelhoriasAdminMobile {...props} /> : <SugestoesMelhoriasAdminDesktop {...props} />
}

export default SugestoesMelhoriasAdmin
