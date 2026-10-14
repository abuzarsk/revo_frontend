import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS, getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';
import { ensureProfileRole, readRoleId, readStoredJson, writeStoredJson } from './member-role';

interface MemberProfileData {
  name: string;
  email: string;
  phone: string;
  organization: string;
  location: string;
  interests: string[];
  bio: string;
  avatar: string;
}

const PROFILE_KEY = 'revo-profile-member-v1';

@Component({
  selector: 'app-member-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-profile.html',
  styleUrl: './member.css',
})
export class MemberProfile implements OnInit {
  profile: MemberProfileData = this.blank();
  saved = '';
  message = '';
  error = '';
  readonly interestOptions = ['Audio', 'Wearables', 'Accessories', 'Beauty', 'Fashion', 'Home'];

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!ensureProfileRole(this.router)) {
      return;
    }
    const user = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.user ?? {};
    const stored = readStoredJson(this.storageKey(), this.blank());
    this.profile = {
      ...this.blank(),
      name: stored.name || user.name || '',
      email: stored.email || user.email || '',
      phone: stored.phone || user.mobile || user.phone || '',
      organization: stored.organization || '',
      location: stored.location || '',
      interests: this.readInterests(stored.interests),
      bio: stored.bio || '',
      avatar: stored.avatar || '',
    };
    this.saved = JSON.stringify(this.profile);
  }

  get dirty(): boolean {
    return JSON.stringify(this.profile) !== this.saved;
  }

  get completion(): number {
    const filled = [this.profile.name, this.profile.email, this.profile.phone, this.profile.location].filter(
      (value) => value.trim().length > 0,
    ).length;
    const interests = this.profile.interests.length > 0 ? 1 : 0;
    return Math.round(((filled + interests) / 5) * 100);
  }

  hasInterest(category: string): boolean {
    return this.profile.interests.includes(category);
  }

  toggleInterest(category: string, checked: boolean): void {
    const interests = checked
      ? [...this.profile.interests, category]
      : this.profile.interests.filter((item) => item !== category);
    this.profile = { ...this.profile, interests };
  }

  onPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.error = 'Choose an image file.';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.error = 'Profile images must be smaller than 1 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.profile = { ...this.profile, avatar: reader.result };
        this.error = '';
        this.message = 'Photo updated. Save your profile to keep it.';
      }
    };
    reader.readAsDataURL(file);
  }

  clearPhoto(): void {
    this.profile = { ...this.profile, avatar: '' };
  }

  save(): void {
    if (this.profile.name.trim().length < 2) {
      this.error = 'Name must be at least 2 characters.';
      this.message = '';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.profile.email.trim())) {
      this.error = 'Enter a valid email address.';
      this.message = '';
      return;
    }
    this.profile = {
      ...this.profile,
      name: this.profile.name.trim(),
      email: this.profile.email.trim().toLowerCase(),
      phone: this.profile.phone.trim(),
      organization: this.profile.organization.trim(),
      location: this.profile.location.trim(),
      interests: this.profile.interests.filter((item) => this.interestOptions.includes(item)),
      bio: this.profile.bio.trim(),
    };
    writeStoredJson(this.storageKey(), this.profile);
    this.saved = JSON.stringify(this.profile);
    this.error = '';
    this.message = 'Profile saved in this browser.';
  }

  private readInterests(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && this.interestOptions.includes(item));
    }
    if (typeof value === 'string') {
      const text = value.toLowerCase();
      return this.interestOptions.filter((item) => text.includes(item.toLowerCase()));
    }
    return [];
  }

  private storageKey(): string {
    return readRoleId() === ENTITY_TYPE_IDS.MEDIATOR ? 'revo-profile-mediator-v1' : PROFILE_KEY;
  }

  private blank(): MemberProfileData {
    return {
      name: '',
      email: '',
      phone: '',
      organization: '',
      location: '',
      interests: [],
      bio: '',
      avatar: '',
    };
  }
}
