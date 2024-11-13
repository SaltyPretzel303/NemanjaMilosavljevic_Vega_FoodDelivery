import Overlay from 'react-modal'
import { useNavigate } from 'react-router-dom';
import { EmailPasswordPreBuiltUI } from 'supertokens-auth-react/recipe/emailpassword/prebuiltui';
import { AuthPage } from 'supertokens-auth-react/ui';
// import { SignInAndUp } from "supertokens-auth-react/recipe/emailpassword/prebuiltui"


export default function LoginPopup({
	loginVisible,
	setLoginVisible,
}: {
	loginVisible: boolean
	setLoginVisible: React.Dispatch<boolean>
}) {

	return (
		<Overlay
			ariaHideApp={false}
			isOpen={loginVisible}
			shouldCloseOnEsc={true}
			onRequestClose={() => setLoginVisible(false)}>

			<AuthPage preBuiltUIList={[EmailPasswordPreBuiltUI]}  />
		</Overlay>

	);
}