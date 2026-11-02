import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/userRelated/userHandle';
import styled from 'styled-components';

const Logout = () => {
    const currentUser = useSelector(state => state.user.currentUser);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    const handleCancel = () => {
        navigate(-1);
    };

   return (
    <PageWrapper>

        <LogoutCard>

            <AvatarCircle>

                {currentUser?.name?.charAt(0)}

            </AvatarCircle>

            <UserName>

                {currentUser.name}

            </UserName>

            <UserRole>

                You are about to sign out of your account.

            </UserRole>

            <LogoutMessage>

                Are you sure you want to log out?
                You can sign back in anytime using your credentials.

            </LogoutMessage>

            <ButtonGroup>

                <LogoutButtonLogout
                    onClick={handleLogout}
                >

                    Log Out

                </LogoutButtonLogout>

                <LogoutButtonCancel
                    onClick={handleCancel}
                >

                    Cancel

                </LogoutButtonCancel>

            </ButtonGroup>

        </LogoutCard>

    </PageWrapper>
);
};

export default Logout;
const PageWrapper = styled.div`
    min-height: 80vh;

    display:flex;
    justify-content:center;
    align-items:center;

    padding:30px;
`;

const LogoutCard = styled.div`
    width:100%;
    max-width:480px;

    background:linear-gradient(
        135deg,
        #111827,
        #0F172A
    );

    border:1px solid #1E293B;

    border-radius:28px;

    padding:45px 35px;

    display:flex;
    flex-direction:column;
    align-items:center;

    box-shadow:0 25px 60px rgba(0,0,0,.35);

    position:relative;
    overflow:hidden;

    &::before{
        content:"";
        position:absolute;
        width:220px;
        height:220px;
        border-radius:50%;
        background:rgba(37,99,235,.08);
        top:-100px;
        right:-100px;
    }
`;

const AvatarCircle = styled.div`
    width:95px;
    height:95px;

    border-radius:50%;

    display:flex;
    justify-content:center;
    align-items:center;

    background:linear-gradient(
        135deg,
        #2563EB,
        #1D4ED8
    );

    color:white;

    font-size:2.6rem;
    font-weight:700;

    margin-bottom:24px;

    box-shadow:0 18px 40px rgba(37,99,235,.35);
`;

const UserName = styled.h2`
    color:white;
    font-size:2rem;
    font-weight:800;

    margin:0;
`;

const UserRole = styled.p`
    color:#60A5FA;

    margin-top:10px;
    margin-bottom:28px;

    font-size:1rem;
`;

const LogoutMessage = styled.p`
    color:#CBD5E1;

    text-align:center;

    line-height:1.8;

    margin-bottom:36px;
`;

const ButtonGroup = styled.div`
    display:flex;
    gap:16px;

    width:100%;

    @media(max-width:600px){

        flex-direction:column;

    }
`;

const LogoutButton = styled.button`
    flex:1;

    border:none;

    border-radius:14px;

    padding:14px 24px;

    font-size:1rem;
    font-weight:600;

    cursor:pointer;

    transition:.3s;

    color:white;

    &:hover{

        transform:translateY(-3px);

    }
`;

const LogoutButtonLogout = styled(LogoutButton)`
    background:#DC2626;

    &:hover{

        background:#B91C1C;

        box-shadow:0 12px 30px rgba(220,38,38,.35);

    }
`;

const LogoutButtonCancel = styled(LogoutButton)`
    background:#2563EB;

    &:hover{

        background:#1D4ED8;

        box-shadow:0 12px 30px rgba(37,99,235,.35);

    }
`;