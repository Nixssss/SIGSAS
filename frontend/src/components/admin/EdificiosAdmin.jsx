import useAdminViewport from "./useAdminViewport"
import EdificiosAdminDesktop from "./EdificiosAdminDesktop"
import EdificiosAdminMobile from "./EdificiosAdminMobile"

function EdificiosAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <EdificiosAdminMobile {...props} /> : <EdificiosAdminDesktop {...props} />
}

export default EdificiosAdmin
