import { Server } from "lucide-react"


export const CicdMain: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-purple-800 mb-4 flex gap-2 items-center"><Server /> 등록된 서버</h2>
      <ul className="space-y-2">
        <li className="bg-white p-4 rounded-lg shadow">예시 콘텐츠 1</li>
        <li className="bg-white p-4 rounded-lg shadow">예시 콘텐츠 2</li>
      </ul>
    </div>
  )
}