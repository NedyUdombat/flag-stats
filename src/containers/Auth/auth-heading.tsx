interface AuthHeadingProps {
  title: string;
  description?: React.ReactNode;
}

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <div className="space-y-3 text-center">
      <h1 className="font-sans text-3xl leading-none capitalize tracking-tight text-balance sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mx-auto max-w-lg text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
