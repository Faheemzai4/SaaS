type Props = {
  headings: string[];
};

export default function HeadingList({ headings }: Props) {
  return (
    <div className="rounded-lg border p-4 mt-4">
      <h2 className="font-semibold text-lg mb-2">
        H1 Headings
      </h2>

      <ul className="list-disc pl-5">
        {headings.map((heading, index) => (
          <li key={index}>{heading}</li>
        ))}
      </ul>
    </div>
  );
}