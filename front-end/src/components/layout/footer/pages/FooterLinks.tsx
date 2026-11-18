interface FooterLink {
  label: string;
  href: string;
}

interface FooterLinksProps {
  title: string;
  links: FooterLink[];
}

export function FooterLinks({ title, links }: FooterLinksProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
        {title}
      </h3>

      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-[#64748B] dark:text-slate-400 transition-colors hover:text-[#4F46E5] dark:hover:text-indigo-400"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
