import { el } from 'redom';
import { tag } from '../utils/dom';
import { ApiError, authApi } from '../api';
import { router } from '../core/router';
import { session } from '../core/session';
import { toast } from '../components/Toast';

type Mode = 'login' | 'register';

const TEXT: Record<Mode, { title: string; submit: string; switchText: string; switchLink: string; switchRoute: Mode }> = {
  login: {
    title: 'Вход',
    submit: 'Войти',
    switchText: 'Нет аккаунта?',
    switchLink: 'Зарегистрироваться',
    switchRoute: 'register',
  },
  register: {
    title: 'Регистрация',
    submit: 'Создать аккаунт',
    switchText: 'Уже есть аккаунт?',
    switchLink: 'Войти',
    switchRoute: 'login',
  },
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,20}$/;

/** Экран входа и регистрации — одна форма, два режима. */
export class AuthPage {
  readonly el: HTMLElement;
  private mode: Mode = 'login';
  private readonly title = el('h1.auth__title');
  private readonly username = tag('input', 'field__input', { name: 'username', autocomplete: 'username', required: true });
  private readonly password = tag('input', 'field__input', { name: 'password', type: 'password', required: true });
  private readonly confirm = tag('input', 'field__input', { name: 'confirm', type: 'password', autocomplete: 'new-password' });
  private readonly confirmField: HTMLElement;
  private readonly error = el('p.auth__error', { role: 'alert' });
  private readonly submit = tag('button', 'btn btn--wide', { type: 'submit' });
  private readonly switchText = el('span');
  private readonly switchLink = tag('a', 'auth__link');

  constructor() {
    this.confirmField = this.field('Повторите пароль', this.confirm);
    const form = tag(
      'form',
      'auth__form',
      this.title,
      el('p.auth__lead', 'Слушайте треки и собирайте избранное на любом устройстве'),
      this.field('Имя пользователя', this.username),
      this.field('Пароль', this.password),
      this.confirmField,
      this.error,
      this.submit,
      el('p.auth__switch', this.switchText, ' ', this.switchLink),
    );

    this.el = el(
      'main.auth',
      tag('a', 'logo logo--auth', { href: '#/login' }, el('span.logo__mark'), el('span.logo__text', 'VibeCast Studio')),
      form,
    );

    // Проверку полей делаем сами, чтобы показывать понятные сообщения на русском
    form.noValidate = true;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.onSubmit();
    });
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    const text = TEXT[mode];
    this.title.textContent = text.title;
    this.submit.textContent = text.submit;
    this.switchText.textContent = text.switchText;
    this.switchLink.textContent = text.switchLink;
    this.switchLink.href = `#/${text.switchRoute}`;
    this.confirmField.hidden = mode === 'login';
    this.password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    this.error.textContent = '';
    this.password.value = '';
    this.confirm.value = '';
  }

  private field(label: string, input: HTMLInputElement): HTMLElement {
    return el('label.field', el('span.field__label', label), input);
  }

  private validate(): string | null {
    const username = this.username.value.trim();
    const password = this.password.value;
    if (!username || !password) return 'Заполните все поля';
    if (this.mode === 'register') {
      if (!USERNAME_PATTERN.test(username)) return 'Имя: 3–20 символов, латиница, цифры, точка, дефис или подчёркивание';
      if (password.length < 6) return 'Пароль должен быть не короче 6 символов';
      if (password !== this.confirm.value) return 'Пароли не совпадают';
    }
    return null;
  }

  private async onSubmit(): Promise<void> {
    const problem = this.validate();
    this.error.textContent = problem ?? '';
    if (problem) return;

    const credentials = { username: this.username.value.trim(), password: this.password.value };
    this.submit.disabled = true;
    try {
      if (this.mode === 'register') {
        await authApi.register(credentials);
        toast('Аккаунт создан');
      }
      const { token } = await authApi.login(credentials);
      session.start(token, credentials.username);
      router.go('tracks');
    } catch (error) {
      this.error.textContent = error instanceof ApiError ? error.message : 'Что-то пошло не так, попробуйте ещё раз';
    } finally {
      this.submit.disabled = false;
    }
  }
}
