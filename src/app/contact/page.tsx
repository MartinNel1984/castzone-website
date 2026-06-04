export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-5xl font-heading font-bold text-bone-white uppercase mb-2">Contact Us</h1>
      <p className="text-storm font-body mb-10">
        Questions, partnerships, moderation issues or just want to say hi — we&apos;re a small team and we read everything.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {[
          { title: "General Enquiries", email: "hello@castzone.co.za", desc: "General questions about CastZone" },
          { title: "Advertising & Partnerships", email: "advertise@castzone.co.za", desc: "Brand zones, sponsorships, media partnerships" },
          { title: "Moderation", email: "mods@castzone.co.za", desc: "Report a post, appeal a decision" },
          { title: "Technical Issues", email: "support@castzone.co.za", desc: "Bugs, account issues, login problems" },
        ].map((item) => (
          <div key={item.title} className="bg-deep-water-light border border-surface-teal rounded-lg p-6">
            <h2 className="text-bone-white font-heading font-bold uppercase mb-1">{item.title}</h2>
            <p className="text-storm font-body text-xs mb-3">{item.desc}</p>
            <a
              href={`mailto:${item.email}`}
              className="text-cast-orange hover:underline font-body text-sm"
            >
              {item.email}
            </a>
          </div>
        ))}
      </div>

      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-6">
        <h2 className="text-bone-white font-heading font-bold uppercase mb-3">Based in South Africa</h2>
        <p className="text-pale-water font-body text-sm leading-relaxed">
          CastZone is proudly South African — built, run and maintained in SA for SA anglers.
          We aim to respond to all enquiries within 48 hours.
        </p>
      </div>
    </div>
  );
}
