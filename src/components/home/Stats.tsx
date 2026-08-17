import AnimatedCounter from '../common/AnimatedCounter';

export default function Stats() {
  return (
    <section className="py-16" style={{ backgroundColor: 'rgba(201,162,39,0.06)' }}>
      <div className="container-luxe grid grid-cols-2 md:grid-cols-4 gap-8">
        <AnimatedCounter to={15000} suffix="+" label="Happy Clients" />
        <AnimatedCounter to={2000} suffix="+" label="Products" />
        <AnimatedCounter to={100} suffix="+" label="Cities Served" />
        <AnimatedCounter to={98} suffix="%" label="Satisfaction Rate" />
      </div>
    </section>
  );
}
