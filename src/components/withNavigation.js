import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom';

const withNavigation = (WrappedComponent) => (props) => {
    const navigate = useNavigate();
    const params = useParams();

    return <WrappedComponent navigate={navigate} params={params} {...props} />;
};

export default withNavigation;