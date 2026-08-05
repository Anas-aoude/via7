"use client";

interface HeadingProps {
  title: string;
  subtitle?: string;
  center?: boolean;
}

const Heading: React.FC<HeadingProps> = ({
  title,
  subtitle,
  center = false,
}) => {
  return (
    <div className={center ? "text-center" : "text-start"}>
      <h2 className="text-2xl font-bold text-neutral-900">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 font-light text-neutral-500">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default Heading;