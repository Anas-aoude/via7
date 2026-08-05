'use client';

interface ContainerProps {
  children: React.ReactNode; // Korrektur des Tippfehlers
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    <div
      className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-2 px-4" // Korrektur des Klassenpräfixes von "max-2" zu "max-w"
    >
      {children}
    </div>
  );
};

export default Container;
