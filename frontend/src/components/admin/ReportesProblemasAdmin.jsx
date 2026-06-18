import useAdminViewport from "./useAdminViewport"
import ReportesProblemasAdminDesktop from "./ReportesProblemasAdminDesktop"
import ReportesProblemasAdminMobile from "./ReportesProblemasAdminMobile"

function ReportesProblemasAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <ReportesProblemasAdminMobile {...props} /> : <ReportesProblemasAdminDesktop {...props} />
}

export default ReportesProblemasAdmin
