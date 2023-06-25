import { createContext, useContext, ReactNode } from "react";
import { container, ServiceContainer } from '../services/services-container'
import React from 'react'

export const ServicesContainerContext = createContext<ServiceContainer>(container)

export const ServicesContainerProvider = ({ children }: { children: ReactNode }) => {

  return (
    <ServicesContainerContext.Provider value={container}>
      {children}
    </ServicesContainerContext.Provider>
  );
};

export const useContainer = () => useContext(ServicesContainerContext);

export default ServicesContainerProvider
