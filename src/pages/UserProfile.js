import { Image } from 'primereact/image';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';

export const UserProfile = (props) => {

    const getUser = () => {
        let user = JSON.parse(localStorage.getItem('user'))
        return user
    }

    return (
        <div id="userProfile" className="card p-fluid">
            <Panel header="User Details">
                <div className="p-inputgroup">
                    <label style={{ textAlign: 'left', color: 'white', width: '20%' }}>Picture</label>
                    <Image width="400" height="400" src={getUser().picture} preview></Image>
                </div>
                <div className="p-inputgroup">
                    <label style={{ textAlign: 'left', color: 'white', width: '20%' }}>Name</label>
                    <InputText label value={getUser().name}></InputText>
                </div>
                <div className="p-inputgroup">
                    <label style={{ textAlign: 'left', color: 'white', width: '20%' }}>E-mail</label>
                    <InputText value={getUser().email}></InputText>
                </div>
            </Panel>
        </div>
    )
}