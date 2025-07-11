import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

type SessionType = 'SSH' | 'FTP' | 'SFTP';

interface NewSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: {
        label: string;
        type: SessionType;
        host: string;
        port: number;
        username: string;
        authMethod: 'password' | 'key';
        password?: string;
        privateKey?: string;
    }) => Promise<void>;
}

export default function NewSessionModal({ isOpen, onClose, onCreate }: NewSessionModalProps) {
    const [label, setLabel] = useState('');
    const [type, setType] = useState<SessionType>('SSH');
    const [host, setHost] = useState('');
    const [port, setPort] = useState(22);
    const [username, setUsername] = useState('');
    const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
    const [password, setPassword] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [privateKeyTitle, setPrivateKeyTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onCreate({ label, type, host, port, username, authMethod, password, privateKey });
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* 오버레이 배경 */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                                {/* 헤더 */}
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title className="text-xl font-bold text-gray-900 flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        새 세션 생성
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                                        onClick={onClose}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* 폼 */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* 라벨 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            세션 라벨
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                                            placeholder="예: 개발 서버"
                                            value={label}
                                            onChange={e => setLabel(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* 연결 타입 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            연결 타입
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['SSH', 'FTP', 'SFTP'] as const).map((sessionType) => (
                                                <button
                                                    key={sessionType}
                                                    type="button"
                                                    className={`py-2 px-3 rounded-lg border-2 transition-all ${type === sessionType
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    onClick={() => setType(sessionType)}
                                                >
                                                    {sessionType}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 호스트 & 포트 */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                호스트
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                                                placeholder="192.168.1.100"
                                                value={host}
                                                onChange={e => setHost(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                포트
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                                                value={port}
                                                onChange={e => setPort(Number(e.target.value))}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 사용자명 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            사용자명
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                                            placeholder="root"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* 인증 방법 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            인증 방법
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                className={`py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center ${authMethod === 'password'
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                onClick={() => setAuthMethod('password')}
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                비밀번호
                                            </button>
                                            <button
                                                type="button"
                                                className={`py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center ${authMethod === 'key'
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                onClick={() => setAuthMethod('key')}
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                                개인 키
                                            </button>
                                        </div>
                                    </div>

                                    {/* 인증 정보 */}
                                    {authMethod === 'password' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                비밀번호
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Private Key (.pem 파일 업로드)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <label
                                                    htmlFor="privateKeyUpload"
                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white rounded-lg cursor-pointer shadow hover:from-[#7040ff] hover:to-[#5e60e2] transition-all"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                                    </svg>
                                                    {privateKey ? "다시 업로드" : ".pem 파일 선택"}
                                                    <input
                                                        id="privateKeyUpload"
                                                        type="file"
                                                        accept=".pem"
                                                        className="hidden"
                                                        onChange={e => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                setPrivateKey(event.target?.result as string);
                                                                setPrivateKeyTitle(file.name);
                                                            };
                                                            reader.readAsText(file);
                                                        }}
                                                        required
                                                    />
                                                </label>
                                                {privateKey && (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">
                                                        업로드 완료
                                                    </span>
                                                )}
                                            </div>
                                            {privateKey && (
                                                <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded p-2 break-all max-h-24 overflow-auto">
                                                    {privateKeyTitle || '업로드된 키 내용이 없습니다.'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* 버튼 */}
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            onClick={onClose}
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] hover:from-[#7040ff] to-[#5e60e2] rounded-lg transition-all shadow-lg hover:shadow-xl"
                                        >
                                            생성하기
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}