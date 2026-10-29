import { Link } from 'react-router-dom';

const variants = {
  primary: 'bg-rosewood text-white shadow-soft hover:-translate-y-0.5 hover:bg-ink focus-visible:outline-blush',
  dark: 'bg-ink text-white shadow-soft hover:-translate-y-0.5 hover:bg-rosewood focus-visible:outline-ink',
  light: 'bg-white text-ink shadow-sm ring-1 ring-champagne/80 hover:-translate-y-0.5 hover:bg-pearl focus-visible:outline-blush',
  ghost: 'bg-white/70 text-ink shadow-sm ring-1 ring-neutral-300 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-blush'
};

function ButtonLink({ children, className = '', href, icon: Icon, variant = 'primary' }) {
  const base =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  const classes = `${base} ${variants[variant]} ${className}`;
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <span>{children}</span>
    </>
  );

  if (href?.startsWith('/')) {
    return (
      <Link className={classes} to={href}>
        {content}
      </Link>
    );
  }

  return (
    <a className={classes} href={href}>
      {content}
    </a>
  );
}

export default ButtonLink;
