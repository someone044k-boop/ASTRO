import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: #6366f1;
  }
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const Nav = styled.nav`
  margin-left: auto;
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 80px;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    flex-direction: column;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    gap: 1rem;
    animation: ${fadeIn} 0.3s ease;
  }
`;

const NavItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: #666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  padding: 0.5rem 0;
  
  &:hover {
    color: #6366f1;
  }
`;

const NavButton = styled.button`
  color: #666;
  background: none;
  border: none;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #6366f1;
  }
  
  &::after {
    content: '▼';
    font-size: 0.8rem;
    transition: transform 0.2s ease;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const SubMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  padding: 0.5rem 0;
  z-index: 1001;
  animation: ${fadeIn} 0.2s ease;
  
  @media (max-width: 768px) {
    position: static;
    box-shadow: none;
    border: none;
    border-radius: 0;
    background: #f8f9fa;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
  }
`;

const SubMenuLink = styled(Link)`
  display: block;
  color: #666;
  text-decoration: none;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
    color: #6366f1;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0;
    background: transparent;
    
    &:hover {
      background: transparent;
    }
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const UserMenu = styled.div`
  position: relative;
  margin-left: 1rem;
`;

const UserButton = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
  
  &:hover {
    background: #5855eb;
  }
`;

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Отримуємо стан аутентифікації з Redux
  const { isAuthenticated, user } = useSelector(state => state.auth || { isAuthenticated: false, user: null });
  
  const subMenuRef = useRef(null);
  
  // Закриваємо підменю при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target)) {
        setActiveSubMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleSubMenu = (menuName) => {
    setActiveSubMenu(activeSubMenu === menuName ? null : menuName);
  };
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleAuthAction = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      navigate('/auth');
    }
  };

  return (
    <HeaderContainer>
      <Logo to="/">
        Школа Навчання
      </Logo>
      
      <MobileMenuButton onClick={handleMobileMenuToggle}>
        {mobileMenuOpen ? '✕' : '☰'}
      </MobileMenuButton>
      
      <Nav isOpen={mobileMenuOpen}>
        <NavItem>
          <NavLink to="/">Головна</NavLink>
        </NavItem>
        
        <NavItem ref={subMenuRef}>
          <NavButton 
            isOpen={activeSubMenu === 'knowledge'}
            onClick={() => toggleSubMenu('knowledge')}
          >
            База Знань
          </NavButton>
          {activeSubMenu === 'knowledge' && (
            <SubMenu>
              <SubMenuLink to="/base-knowledge/faq">FAQ</SubMenuLink>
              <SubMenuLink to="/base-knowledge/about">Про майстра</SubMenuLink>
              <SubMenuLink to="/base-knowledge/youtube">Ютуб канал</SubMenuLink>
              <SubMenuLink to="/base-knowledge/navigation">Навігація по сайту</SubMenuLink>
              <SubMenuLink to="/base-knowledge/ask-author">Спитати автора</SubMenuLink>
              <SubMenuLink to="/base-knowledge/city-of-gods">Технологія "місто Богів"</SubMenuLink>
            </SubMenu>
          )}
        </NavItem>
        
        <NavItem ref={subMenuRef}>
          <NavButton 
            isOpen={activeSubMenu === 'courses'}
            onClick={() => toggleSubMenu('courses')}
          >
            Навчання
          </NavButton>
          {activeSubMenu === 'courses' && (
            <SubMenu>
              <SubMenuLink to="/courses/level-1">1й курс</SubMenuLink>
              <SubMenuLink to="/courses/level-2">2й курс</SubMenuLink>
              <SubMenuLink to="/courses/level-3">3й курс</SubMenuLink>
              <SubMenuLink to="/courses/level-4">4й курс</SubMenuLink>
              <SubMenuLink to="/courses/program">Програма навчання</SubMenuLink>
            </SubMenu>
          )}
        </NavItem>
        
        <NavItem>
          <NavLink to="/consultations">Консультації</NavLink>
        </NavItem>
        
        <NavItem>
          <NavLink to="/workshop" onClick={() => navigate('/workshop')}>Майстерня</NavLink>
        </NavItem>
        
        <NavItem>
          <NavLink to="/astro">Астро</NavLink>
        </NavItem>
        
        <UserMenu>
          <UserButton onClick={handleAuthAction}>
            {isAuthenticated ? user?.email || 'Профіль' : 'Вхід'}
          </UserButton>
        </UserMenu>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;